# Retrieval Evaluation

## 1. Objective

Retrieval evaluation measures whether Paplet can identify relevant passages from uploaded research papers before passing them to the language model.

The primary objective is to retrieve supporting evidence consistently while avoiding unnecessary context.

## 2. Retrieval Implementation

Paplet uses dense vector retrieval.

The retrieval process:

1. Convert the user's question into an embedding.
2. Compare the query embedding against stored chunk embeddings.
3. Rank chunks using cosine similarity.
4. Apply document and user-ownership filters.
5. Return the highest-ranked chunks.

### Configuration

| Parameter                    |                     Value |
| ---------------------------- | ------------------------: |
| Embedding model              | `Xenova/all-MiniLM-L6-v2` |
| Embedding dimensions         |                       384 |
| Similarity metric            |         Cosine similarity |
| Vector index                 |                      HNSW |
| PostgreSQL operator class    |       `vector_cosine_ops` |
| `/ask` retrieval top-K       |                        12 |
| `/search` default top-K      |                         5 |
| `/search` maximum top-K      |                        20 |
| Minimum retrieval similarity |                      0.15 |

The similarity threshold is a retrieval heuristic. It is not a calibrated probability that an answer is correct.

## 3. Early Retrieval Validation

An initial retrieval experiment used five representative questions to verify the embedding, persistence and similarity-search pipeline.

### Observations

- Hit@5: 100% on the five-question sample.
- Minimum measured retrieval latency: 98.87 ms.
- Median retrieval latency: 101.42 ms.
- Average retrieval latency: 200.82 ms.
- Maximum retrieval latency: 435.12 ms.
- HNSW index creation and verification completed successfully.

The database query planner selected a sequential scan during the observed query plan. This was attributed to the small dataset at that stage; index existence does not guarantee that PostgreSQL will choose it for every query.

### Dataset snapshot

At the time of this experiment:

| Measurement               | Count |
| ------------------------- | ----: |
| Total chunks              |   249 |
| Chunks with embeddings    |    26 |
| Chunks without embeddings |   223 |

These counts describe an early implementation snapshot, not the current deployed database.

The five-question result is an initial pipeline validation, not a statistically representative retrieval benchmark.

## 4. Later Retrieval Evaluation

A larger manually labelled evaluation set was created using three research papers:

- Nutrition
- AI-based financial prediction
- G-Retriever

The dataset contained 17 questions:

| Question category | Count |
| ----------------- | ----: |
| Answerable        |    14 |
| Unanswerable      |     3 |
| Total             |    17 |

The evaluation measured whether relevant evidence could be found for answerable questions.

### Baseline result

| Metric                              |                      Result |
| ----------------------------------- | --------------------------: |
| Hit@5                               |                      57.14% |
| Deterministic ordered top-5 results | 17/17 repeated consistently |

The deterministic check compared the ordered top-five chunk IDs across two runs. All 17 questions returned the same ordered results in both runs.

This demonstrates repeatability for the tested inputs, not retrieval relevance or answer correctness.

## 5. Top-K Experiment

A top-K sweep was conducted to measure how retrieval coverage changed as more chunks were returned.

|   K | Hit rate |
| --: | -------: |
|   3 |   50.00% |
|   5 |   71.43% |
|   8 |   85.71% |
|  12 |   92.86% |
|  16 |   92.86% |
|  20 |  100.00% |

### Interpretation

- Increasing K improved the chance of retrieving relevant evidence.
- Improvement became marginal between K=12 and K=16.
- K=20 achieved complete coverage on this evaluation set.
- Returning more chunks also increases the amount of context passed to the generation model.

K=12 was selected as a provisional balance between retrieval coverage and context size.

The sweep results belong to this specific evaluation dataset and should not be interpreted as guaranteed production retrieval performance.

## 6. Evaluation Methodology

### Hit@K

Hit@K measures the percentage of answerable questions for which at least one relevant chunk appears in the top K retrieved results.

\[
Hit@K =
\frac{\text{Questions with a relevant chunk in top K}}
{\text{Total answerable questions}}
\times 100
\]

Unanswerable questions are not included in this retrieval-recall denominator.

### Determinism

Determinism checks whether repeated identical queries produce the same ordered retrieval results.

This measures repeatability, not relevance.

### Retrieval latency

Latency measures the time taken by the retrieval operation. It should be reported separately from end-to-end answer-generation latency, which also includes embedding and LLM inference.

## 7. Limitations

- The evaluation set is small and manually labelled.
- Results depend on the selected research papers and question wording.
- High Hit@K does not guarantee that the language model will produce a correct answer.
- Similarity ranking alone does not establish semantic sufficiency.
- Increasing K can improve coverage while introducing irrelevant context.
- Results from the early five-question experiment are not directly comparable to the later 17-question evaluation.

## 8. Conclusion

The retrieval pipeline, vector persistence and similarity search have been implemented and evaluated.

The later evaluation showed that retrieval coverage improved substantially as K increased. K=12 was selected provisionally, achieving 92.86% Hit@K on the tested answerable questions.

Retrieval consistency across different phrasings remains a limitation and requires further evaluation using a broader, repeatable dataset.
