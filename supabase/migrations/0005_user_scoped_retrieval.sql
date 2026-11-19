DROP FUNCTION IF EXISTS public.match_chunks(
    VECTOR,
    INT,
    UUID[]
);
CREATE OR REPLACE FUNCTION public.match_chunks(
    p_user_id UUID,
    p_query_embedding VECTOR(384),
    p_match_count INT,
    p_document_ids UUID[]
)
RETURNS TABLE(
    id UUID,
    document_id UUID,
    content TEXT,
    page_start INTEGER,
    page_end INTEGER,
    similarity DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        c.id,
        c.document_id,
        c.content,
        c.page_start,
        c.page_end,
        1 - (c.embedding <=> p_query_embedding) AS similarity
    FROM public.chunks AS c
    INNER JOIN public.documents AS d
        ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
        AND d.user_id = p_user_id
        AND (
            p_document_ids IS NULL
            OR c.document_id = ANY(p_document_ids)
        )
    ORDER BY c.embedding <=> p_query_embedding
    LIMIT p_match_count;
$$;
