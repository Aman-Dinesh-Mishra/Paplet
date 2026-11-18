import dotenv from "dotenv";
import { resolve } from "node:path";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { EvaluationDatasetSchema } from "./schema.js";
import { hitAtK, p50Latency, p95Latency } from "./metrics.js";

async function main(): Promise<void> {
  dotenv.config({
    path: resolve(process.cwd(), "apps/api/.env"),
  });

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL isn't configured");
  }

  const raw = await readFile(
    new URL("./questions.json", import.meta.url),
    "utf-8",
  );

  const parsed = EvaluationDatasetSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(
      `Invalid evaluation dataset: ${JSON.stringify(parsed.error.flatten())}`,
    );
  }

  const { retrieveChunks } =
    await import("../apps/api/src/services/retrieval.service.js");

  const { pool } = await import("../apps/api/src/db/pool.js");

  const topKValues = [8, 12, 16, 20];

  const report = {
    generatedAt: new Date().toISOString(),
    totalQuestions: parsed.data.length,
    experiments: [] as {
      topK: number;
      hitAtK: {
        correct: number;
        total: number;
        percentage: number;
      };
      latencyMs: {
        p50: number | null;
        p95: number | null;
      };
      results: {
        id: string;
        hit: boolean | null;
        latencyMs: number;
        retrieved: {
          documentId: string;
          pageStart: number;
          pageEnd: number;
          similarity: number;
        }[];
      }[];
    }[],
  };

  try {
    for (const k of topKValues) {
      let correct = 0;
      let answerableTotal = 0;

      const latencies: number[] = [];
      const results = [];

      console.log(`\nRunning retrieval experiment: topK=${k}`);

      for (const question of parsed.data) {
        const retrieval = await retrieveChunks(question.question, k);

        latencies.push(retrieval.latencyMs);

        let hit: boolean | null = null;

        if (question.type === "answerable") {
          answerableTotal++;

          hit = hitAtK(
            retrieval.results,
            question.goldDocument,
            question.goldPages,
            k,
          );

          if (hit) correct++;
        }

        results.push({
          id: question.id,
          hit,
          latencyMs: retrieval.latencyMs,
          retrieved: retrieval.results.map((chunk) => ({
            documentId: chunk.documentId,
            pageStart: chunk.pageStart,
            pageEnd: chunk.pageEnd,
            similarity: chunk.similarity,
          })),
        });
      }

      const experiment = {
        topK: k,
        hitAtK: {
          correct,
          total: answerableTotal,
          percentage:
            answerableTotal === 0
              ? 0
              : Number(((correct / answerableTotal) * 100).toFixed(2)),
        },
        latencyMs: {
          p50: p50Latency(latencies),
          p95: p95Latency(latencies),
        },
        results,
      };

      report.experiments.push(experiment);

      console.log({
        topK: k,
        hitAtK: `${correct}/${answerableTotal}`,
        percentage: experiment.hitAtK.percentage,
        p50LatencyMs: experiment.latencyMs.p50,
        p95LatencyMs: experiment.latencyMs.p95,
      });
    }

    const resultsDirectory = resolve(process.cwd(), "eval/results");

    await mkdir(resultsDirectory, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, "-");

    const outputPath = resolve(
      resultsDirectory,
      `topk-sweep-${timestamp}.json`,
    );

    await writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8");

    console.log("\nTop-K sweep summary:");

    console.table(
      report.experiments.map((experiment) => ({
        TopK: experiment.topK,
        "Hit@K (%)": experiment.hitAtK.percentage,
        "Correct / Total": `${experiment.hitAtK.correct}/${experiment.hitAtK.total}`,
        "p50 (ms)": experiment.latencyMs.p50,
        "p95 (ms)": experiment.latencyMs.p95,
      })),
    );

    console.log(`\nReport saved to: ${outputPath}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Top-K sweep failed:", error);
  process.exitCode = 1;
});
