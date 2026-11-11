import { readFile } from "node:fs/promises";

type EvalQuestion = {
  id: string;
  question: string;
  paperId: string;
  expectedKeywords: string[];
};

async function main() {
  const raw = await readFile(new URL("./questions.json", import.meta.url), "utf-8");
  const questions: EvalQuestion[] = JSON.parse(raw);
  console.log(`Loaded ${questions.length} eval question(s).`);
  // TODO: call the API, score answers, write results to eval/results/
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
