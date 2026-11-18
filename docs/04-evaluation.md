# Evaluation Framework

## Overview

Paplet includes a reproducible evaluation harness for measuring retrieval quality, citation validity, refusal accuracy, and response latency.

The evaluation dataset contains 17 manually labelled questions across three research papers:

- Nutrition research
- AI-based financial prediction
- Graph-based retrieval (G-Retriever)

The dataset includes answerable and unanswerable questions. Each answerable question has a gold document and expected page range.

## Evaluation Pipeline

1. Load and validate `eval/questions.json` using Zod.
2. Generate query embeddings and retrieve the top 5 chunks.
3. Compare retrieved document and page ranges against gold labels.
4. Generate an answer using the retrieved context and Groq.
5. Validate citations and refusal behavior.
6. Calculate evaluation metrics.
7. Save timestamped JSON reports under `eval/results/`.

## Metrics

| Metric            | Description                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Hit@5             | Whether at least one of the top 5 retrieved chunks overlaps the gold document and expected pages |
| Citation validity | Whether generated citation IDs and quoted text match retrieved chunks                            |
| Refusal accuracy  | Whether the system correctly answers answerable questions and refuses unanswerable questions     |
| p50 latency       | Median successful evaluation latency                                                             |
| p95 latency       | 95th-percentile successful evaluation latency                                                    |

Failed provider requests are recorded separately and excluded from answer-quality metrics.

## Retrieval Evaluation

The latest 17-question retrieval run achieved:

- Successful retrievals: 17/17
- Retrieval failures: 0
- Hit@5: 57.14%

The retrieval determinism check was executed twice for every dataset question.

- Questions checked: 17
- Passed: 17
- Failed: 0
- Determinism: 100%

Determinism was verified by comparing the ordered IDs of the top 5 retrieved chunks across repeated runs.

## LLM Evaluation Limitations

Groq's free-tier daily token allowance was exhausted during the 17-question evaluation.

Consequently, the latest evaluation did not produce a complete LLM-quality baseline. Citation validity, refusal accuracy, and generation latency must not be interpreted as measured results when generation requests fail.

No paid API upgrade is required for the current development scope. LLM evaluation can be repeated after the provider quota resets.

## Running Evaluations

Run the complete evaluation:

```powershell
npm run eval
```

Run the retrieval determinism check:

```powershell
npx tsx eval/check-retrieval.ts
```

Run the dataset schema tests:

```powershell
npx vitest run apps/api/tests/eval-schema.test.ts
```

## Output

Evaluation reports are written to:

```text
eval/results/
```

Each report contains the generation timestamp, metric summary, sample sizes, per-question results, and any recorded errors.

## Limitations

- Evaluation quality depends on the accuracy of manually assigned gold documents and page labels.
- Hit@5 measures page-level retrieval overlap, not semantic answer correctness.
- Citation validation verifies textual support, not the factual correctness of the generated answer.
- Retrieval determinism applies to the current dataset and database state.
- LLM evaluation coverage is constrained by the available provider quota.
