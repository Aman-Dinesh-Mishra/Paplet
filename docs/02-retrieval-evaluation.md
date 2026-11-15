# Retrieval Evaluation

## Scope

Day 7 evaluation of Paplet's semantic retrieval pipeline using PostgreSQL, pgvector, and `Xenova/all-MiniLM-L6-v2`.

- Embedding dimensions: 384
- Similarity metric: Cosine similarity
- Retrieval: Top-5 chunks
- Index: HNSW with `vector_cosine_ops`

## Retrieval Quality

Five representative research-paper questions were evaluated through manual relevance checks.

| Metric                               | Result |
| ------------------------------------ | -----: |
| Queries evaluated                    |      5 |
| Queries with a relevant top-5 result |      5 |
| Hit@5                                |   100% |

Hit@5 indicates whether at least one relevant passage appears in the retrieved top five. This is a preliminary manual evaluation, not a statistically representative benchmark.

## Latency

Five repeated requests using the same query:

| Metric  |   Latency |
| ------- | --------: |
| Minimum |  98.87 ms |
| Median  | 101.42 ms |
| Average | 200.82 ms |
| Maximum | 435.12 ms |

The variation suggests possible warm-up or transient overhead. These local measurements are not production performance guarantees.

## Index Verification

The HNSW index was created and verified with `vector_cosine_ops`. PostgreSQL selected a sequential scan during `EXPLAIN ANALYZE`, likely because the current dataset is small. Index utilization should be reassessed as data volume grows.

## Dataset Limitations

| Metric                    | Count |
| ------------------------- | ----: |
| Total chunks              |   249 |
| Embedded chunks           |    26 |
| Chunks without embeddings |   223 |

Retrieval evaluation was limited to the available embedded content.

## Conclusion

The retrieval pipeline returned relevant content in the top five for all five evaluation queries. Initial latency and index checks are satisfactory for functional validation. Larger datasets and a labeled evaluation set are needed to assess scalability and retrieval quality reliably.
