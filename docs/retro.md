# Retrospective

## What Went Well

- Built an end-to-end RAG pipeline covering PDF ingestion, chunking, embeddings, vector search and answer generation.
- Used PostgreSQL with pgvector for document and embedding storage.
- Added citation validation to check generated references against retrieved source content.
- Integrated Supabase Auth and user-level document ownership checks.
- Deployed the frontend and backend separately on Render.

## Challenges

- **Retrieval quality:** Relevant passages were sometimes missed for differently phrased questions, resulting in false refusals.
- **Deployment memory:** Embedding inference required optimization. Switched to Q8 quantization and a batch size of four.
- **LLM quota:** Groq free-tier limits prevented completion of the full 17-question answer-generation evaluation.
- **Data isolation:** Authentication required ownership checks across document operations and vector retrieval, not just protected frontend routes.

## Key Learnings

- Successful vector retrieval does not guarantee a useful answer.
- Citation matching does not prove that a claim is supported by its source.
- Evaluation should guide retrieval changes instead of relying on individual test questions.
- Deployment constraints must be considered during model and infrastructure selection.

## What Needs Improvement

- Expand the manually labelled evaluation dataset.
- Improve retrieval consistency across question phrasings.
- Complete end-to-end answer evaluation.
- Improve production error handling and resource monitoring.
- Configure production-ready email delivery before public use.

## Final Reflection

Paplet helped me understand the engineering involved in building a RAG application beyond basic LLM integration. The core system is implemented and deployed, but retrieval consistency and answer reliability remain areas for improvement.
