# System Evaluation

## 1. Evaluation Objective

Paplet is evaluated at multiple levels to understand whether it can retrieve relevant document passages and generate answers grounded in those passages.

The evaluation separates:

- Retrieval quality.
- Retrieval repeatability.
- Citation validity.
- Refusal behaviour.
- End-to-end response latency.
- Manual application behaviour.

A successful retrieval or structurally valid response does not automatically establish answer correctness.

## 2. Evaluation Dataset

A manually labelled dataset was prepared using three research papers:

- Nutrition.
- AI-based financial prediction.
- G-Retriever.

The dataset contains 17 questions.

| Category     | Questions |
| ------------ | --------: |
| Answerable   |        14 |
| Unanswerable |         3 |
| Total        |        17 |

The dataset provides a repeatable basis for testing retrieval and answer-generation behaviour.

## 3. Retrieval Evaluation

### Baseline

The initial evaluation produced the following result:

| Metric                              | Result |
| ----------------------------------- | -----: |
| Hit@5                               | 57.14% |
| Deterministic ordered top-5 results |  17/17 |

Hit@5 measures whether at least one relevant chunk appears among the five highest-ranked results for an answerable question.

The determinism test compared the ordered top-five chunk IDs across two runs. All 17 questions produced identical ordered results.

This demonstrates repeatability for the tested queries, not correctness or relevance.

### Top-K experiment

A retrieval top-K sweep was conducted using the same evaluation dataset.

|   K | Hit rate |
| --: | -------: |
|   3 |   50.00% |
|   5 |   71.43% |
|   8 |   85.71% |
|  12 |   92.86% |
|  16 |   92.86% |
|  20 |  100.00% |

K=12 was selected provisionally because it achieved 92.86% retrieval coverage without requiring the maximum tested context size.

K=20 achieved complete coverage on this dataset, but that result does not establish that K=20 is optimal for generation quality, latency or token consumption.

## 4. Historical LLM Evaluation

An earlier LLM evaluation was conducted on a 10-question sample.

The recorded results were:

| Metric                          |        Result |
| ------------------------------- | ------------: |
| Citation validity               |          100% |
| Refusal accuracy                |           80% |
| Median end-to-end latency (p50) | 12.86 seconds |
| 95th percentile latency (p95)   | 17.05 seconds |

These measurements are historical results from a smaller evaluation sample.

They should not be treated as the final performance of the deployed application or combined with the 17-question retrieval benchmark.

The later full LLM evaluation could not be completed because the Groq free-tier quota was exhausted.

Consequently, a complete, current end-to-end evaluation across all 17 questions remains outstanding.

## 5. Post-Deployment Manual Smoke Test

A manual smoke test was performed after deployment using the paper _Attention Is All You Need_.

Five questions were tested.

| Test                                                                                       | Observed behaviour                            |
| ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| What problem does the Transformer architecture attempt to solve?                           | Grounded answer with three sources            |
| What are positional encodings in the Transformer architecture?                             | Insufficient-evidence refusal                 |
| How are positional encodings calculated?                                                   | Grounded answer with one source and equations |
| Why does the Transformer use multi-head attention instead of a single attention mechanism? | Insufficient-evidence refusal                 |
| What GPU hardware was used for training?                                                   | Grounded answer with two sources              |

### Observations

- Three questions produced grounded answers.
- Two questions produced refusals despite relevant information being present in the uploaded paper.
- The positional encoding calculation question was answered successfully even though a related conceptual question was refused.
- Retrieval and answer behaviour can vary with question phrasing.

These results expose a retrieval-consistency limitation. They are a manual smoke test, not a statistically representative benchmark.

## 6. Evaluation Metrics

The following metrics are relevant to Paplet.

### Retrieval Hit@K

Measures the percentage of answerable questions for which at least one relevant chunk appears in the top K results.

\[
Hit@K =
\frac{\text{Answerable questions with relevant evidence in top K}}
{\text{Total answerable questions}}
\times 100
\]

### Citation validity

Measures whether generated citations reference retrieved chunks and contain quotations matching normalized source text.

Citation validity does not establish that the cited passage logically supports the entire claim.

### Refusal accuracy

Measures whether the system correctly distinguishes answerable questions from questions lacking sufficient supporting evidence.

A false refusal occurs when the document contains relevant evidence but the system declines to answer.

### Latency

- **p50:** Median response latency.
- **p95:** Latency below which 95% of measured requests complete.

Retrieval latency and end-to-end answer latency should be measured separately.

## 7. Findings

The evaluation establishes the following:

1. The retrieval pipeline is functional and produces repeatable results for the tested queries.
2. Retrieval coverage improves as K increases.
3. K=12 provides a provisional balance between retrieval coverage and context size.
4. Citation validation achieved 100% in the historical 10-question LLM evaluation.
5. Refusal behaviour is imperfect; relevant evidence can be missed.
6. End-to-end generation latency is substantially higher than retrieval-only latency.
7. The current evaluation dataset is too small to establish broad real-world reliability.

## 8. Known Evaluation Gaps

The following work remains necessary for a stronger reliability assessment:

- Complete end-to-end evaluation of the 17-question dataset.
- Repeated tests across different question phrasings.
- More diverse research papers and question types.
- Measurement of false refusals and unsupported answers.
- Separate retrieval and generation latency measurements.
- Re-evaluation after significant changes to chunking, retrieval or prompting.

## 9. Conclusion

Paplet has a working RAG pipeline with document ingestion, vector retrieval, answer generation and citation validation.

The available experiments demonstrate functional retrieval and repeatability, but also reveal that relevant evidence is not consistently retrieved for every question.

The system should therefore be described as an implemented and deployed research-paper assistant with measured limitations, rather than as a fully reliable research-answering system.

Further improvements should be guided by repeatable evaluation results instead of isolated question-specific prompt adjustments.
