import dotenv from "dotenv";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { EvaluationDatasetSchema } from "./schema.js";
import {
  hitAtK,
  citationValidity,
  refusalAccuracy,
  p50Latency,
  p95Latency,
} from "./metrics.js";

type EvaluationRow = {
  id: string;
  type: "answerable" | "unanswerable";
  status: "success" | "error";
  hitAt5: boolean | null;
  citationsValid: boolean | null;
  refusalCorrect: boolean | null;
  answerable: boolean | null;
  retrievedChunks: number;
  latencyMs: number;
  error?: string;
};

async function main(): Promise<void> {
  const raw = await readFile(
    new URL("./questions.json", import.meta.url),
    "utf-8",
  );

  const parsedDataset = EvaluationDatasetSchema.safeParse(JSON.parse(raw));

  if (!parsedDataset.success) {
    console.error("Invalid evaluation dataset:");
    console.error(parsedDataset.error.flatten());
    process.exitCode = 1;
    return;
  }

  const questions = parsedDataset.data;

  console.log(`Loaded ${questions.length} eval question(s).`);

  dotenv.config({
    path: resolve(process.cwd(), "apps/api/.env"),
  });

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL isn't configured");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY isn't configured");
  }

  if (!process.env.LLM_MODEL) {
    throw new Error("LLM_MODEL isn't configured");
  }

  const { retrieveChunks } =
    await import("../apps/api/src/services/retrieval.service.js");

  const { generateAnswer } =
    await import("../apps/api/src/services/answer.service.js");

  const { pool } = await import("../apps/api/src/db/pool.js");

  const rows: EvaluationRow[] = [];

  const hitResults: boolean[] = [];
  const citationResults: boolean[] = [];
  const refusalResults: boolean[] = [];
  const successfulLatencies: number[] = [];

  let retrievalSuccesses = 0;
  let generationSuccesses = 0;
  let generationFailures = 0;
  let retrievalFailures = 0;

  try {
    for (const question of questions) {
      const startTime = performance.now();

      let retrievedChunks = 0;
      let hitAt5Result: boolean | null = null;

      try {
        // Retrieval accepts the question as a string.
        const retrieval = await retrieveChunks(question.question);

        retrievedChunks = retrieval.results.length;
        retrievalSuccesses++;

        if (question.type === "answerable") {
          hitAt5Result = hitAtK(
            retrieval.results,
            question.goldDocument,
            question.goldPages,
            5,
          );

          hitResults.push(hitAt5Result);
        }

        // Generation accepts the question and retrieved chunks separately.
        const answer = await generateAnswer(
          question.question,
          retrieval.results,
        );

        const latencyMs = performance.now() - startTime;

        const citationsValid = answer.is_answerable
          ? citationValidity(answer, retrieval.results)
          : question.type === "unanswerable"
            ? true
            : false;

        const refusalCorrect = refusalAccuracy(
          question.type,
          answer.is_answerable,
        );

        if (question.type === "answerable") {
          citationResults.push(citationsValid);
        }

        refusalResults.push(refusalCorrect);

        generationSuccesses++;
        successfulLatencies.push(latencyMs);

        rows.push({
          id: question.id,
          type: question.type,
          status: "success",
          hitAt5: hitAt5Result,
          citationsValid:
            question.type === "answerable" ? citationsValid : null,
          refusalCorrect,
          answerable: answer.is_answerable,
          retrievedChunks,
          latencyMs: Number(latencyMs.toFixed(2)),
        });
      } catch (error) {
        const latencyMs = performance.now() - startTime;

        const message = error instanceof Error ? error.message : String(error);

        if (retrievedChunks === 0) {
          retrievalFailures++;
        } else {
          generationFailures++;
        }

        console.error(`Evaluation failed for ${question.id}:`, message);

        rows.push({
          id: question.id,
          type: question.type,
          status: "error",
          hitAt5: hitAt5Result,
          citationsValid: null,
          refusalCorrect: null,
          answerable: null,
          retrievedChunks,
          latencyMs: Number(latencyMs.toFixed(2)),
          error: message,
        });
      }
    }

    const percentage = (values: boolean[]): number | null => {
      if (values.length === 0) {
        return null;
      }

      const successful = values.filter(Boolean).length;

      return Number(((successful / values.length) * 100).toFixed(2));
    };

    const summary = {
      totalQuestions: questions.length,
      successfulRetrievals: retrievalSuccesses,
      retrievalFailures,
      successfulGenerations: generationSuccesses,
      generationFailures,
      hitAt5: percentage(hitResults),
      answerableCitationSuccess: percentage(citationResults),
      refusalAccuracy: percentage(refusalResults),
      p50LatencyMs: p50Latency(successfulLatencies),
      p95LatencyMs: p95Latency(successfulLatencies),
      metricSampleSizes: {
        hitAt5: hitResults.length,
        answerableCitationSuccess: citationResults.length,
        refusalAccuracy: refusalResults.length,
        latency: successfulLatencies.length,
      },
    };

    console.log("\nEvaluation results:\n");
    console.table(rows);

    console.log("\nSummary:\n");
    console.table([
      { Metric: "Total questions", Value: summary.totalQuestions },
      { Metric: "Successful retrievals", Value: summary.successfulRetrievals },
      { Metric: "Retrieval failures", Value: summary.retrievalFailures },
      {
        Metric: "Successful generations",
        Value: summary.successfulGenerations,
      },
      { Metric: "Generation failures", Value: summary.generationFailures },
      { Metric: "Hit@5 (%)", Value: summary.hitAt5 ?? "N/A" },
      {
        Metric: "Answerable citation success (%)",
        Value: summary.answerableCitationSuccess ?? "N/A",
      },
      {
        Metric: "Refusal accuracy (%)",
        Value: summary.refusalAccuracy ?? "N/A",
      },
      { Metric: "p50 latency (ms)", Value: summary.p50LatencyMs ?? "N/A" },
      { Metric: "p95 latency (ms)", Value: summary.p95LatencyMs ?? "N/A" },
    ]);

    const timestamp = new Date().toISOString().replace(/:/g, "-");

    const resultsDirectory = resolve(process.cwd(), "eval/results");

    await mkdir(resultsDirectory, { recursive: true });

    const report = {
      generatedAt: new Date().toISOString(),
      summary,
      results: rows,
    };

    const reportPath = resolve(resultsDirectory, `${timestamp}.json`);

    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

    console.log(`\nReport saved to ${reportPath}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Evaluation runner failed:", error);
  process.exitCode = 1;
});
