## Day 11 — Retrieval Tuning Results

### Evaluation scope

- Golden dataset: 17 questions
- Answerable questions: 14
- Unanswerable questions: 3
- Evaluation type: Retrieval-only
- LLM generation: Excluded because the Groq free-tier daily token quota was exhausted.

### Top-K parameter sweep

| Top-K |   Hit@K | Correct |
| ----: | ------: | ------: |
|     3 |  50.00% |    7/14 |
|     5 |  71.43% |   10/14 |
|     8 |  85.71% |   12/14 |
|    12 |  92.86% |   13/14 |
|    16 |  92.86% |   13/14 |
|    20 | 100.00% |   14/14 |

### Selected configuration

The application uses Top-K = 12 provisionally.

Reasons:

- Improves retrieval coverage over the previous Top-K = 5.
- Achieves 92.86% Hit@12 on the current answerable dataset.
- Top-K = 16 provides no additional improvement.
- Top-K = 20 achieves complete coverage but increases the amount of context sent to the LLM.

### Remaining retrieval miss

Question: retriever-001

The question asks which optimization problem G-Retriever uses to retrieve relevant subgraphs.

The supporting passage on page 1 appears at rank 20, with similarity 0.4604. Related passages from pages 2–3 and 7 appear earlier.

This is a ranking issue, not a missing source passage or incorrect gold-page label.

### Chunking configuration

The existing configuration remains unchanged:

- Target tokens: 220
- Maximum tokens: 256
- Overlap ratio: 12%

Chunk-size and overlap changes are deferred because they require regenerating chunks and embeddings for the existing documents. The current experiments do not establish that re-indexing would improve retrieval enough to justify that work.

### Limitations

- The dataset contains only 14 answerable questions.
- Hit@K measures whether a gold page appears in the retrieved results; it does not measure answer correctness.
- Retrieval-only results do not establish citation validity or refusal accuracy.
- The selected Top-K is a provisional engineering trade-off, not a universally optimal value.
