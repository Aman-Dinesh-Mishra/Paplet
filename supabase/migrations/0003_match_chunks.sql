CREATE OR REPLACE FUNCTION match_chunks(
 p_query_embedding VECTOR(384),
 p_match_count INT DEFAULT 5,
 p_document_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(
 id UUID,
 document_id UUID,
 content TEXT,
 page_start INTEGER,
 page_end INTEGER,
 similarity DOUBLE PRECISION
)
LANGUAGE SQL STABLE AS $$
 SELECT c.id, c.document_id,c.content, c.page_start,c.page_end, 1 - (c.embedding <=> p_query_embedding) AS similarity
 FROM chunks as c
 WHERE c.embedding IS NOT NULL
  AND(
 p_document_ids IS NULL OR c.document_id = ANY(p_document_ids)
  )
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;