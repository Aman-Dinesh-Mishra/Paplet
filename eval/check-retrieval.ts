import dotenv from "dotenv";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { EvaluationDatasetSchema } from "./schema.js";

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

  let passed = 0;
  let failed = 0;

  try {
    for (const question of parsed.data) {
      const first = await retrieveChunks(question.question);
      const second = await retrieveChunks(question.question);

      const firstIds = first.results.map((chunk) => chunk.id);
      const secondIds = second.results.map((chunk) => chunk.id);

      const deterministic =
        JSON.stringify(firstIds) === JSON.stringify(secondIds);

      if (deterministic) {
        passed++;
      } else {
        failed++;
      }

      console.log({
        id: question.id,
        deterministic,
        firstResultIds: firstIds,
        secondResultIds: secondIds,
      });
    }

    console.log("\nRetrieval determinism summary:");
    console.table([
      { Metric: "Questions checked", Value: parsed.data.length },
      { Metric: "Passed", Value: passed },
      { Metric: "Failed", Value: failed },
      {
        Metric: "Determinism (%)",
        Value: Number(((passed / parsed.data.length) * 100).toFixed(2)),
      },
    ]);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Retrieval determinism check failed:", error);
  process.exitCode = 1;
});
