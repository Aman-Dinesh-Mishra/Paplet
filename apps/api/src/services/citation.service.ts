type RetrievedChunk = {
  id: string;
  content: string;
};

type CitationInput = {
  citations: {
    chunkId: string;
    quote: string;
  }[];
};

const normalizeText = (value: string): string => {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

export const validateCitations = (
  answer: CitationInput,
  chunks: RetrievedChunk[],
) => {
  const errors: string[] = [];

  if (chunks.length === 0) {
    errors.push("No retrieved chunks available");
  }

  for (const citation of answer.citations) {
    const matchingChunk = chunks.find((chunk) => chunk.id === citation.chunkId);

    if (!matchingChunk) {
      errors.push(`Citation references an unknown chunk: ${citation.chunkId}`);
      continue;
    }

    const normalizedContent = normalizeText(matchingChunk.content);
    const normalizedQuote = normalizeText(citation.quote);

    if (!normalizedQuote) {
      errors.push("Citation quote can't be empty");
      continue;
    }

    if (!normalizedContent.includes(normalizedQuote)) {
      errors.push(`Citation quote doesn't match chunk: ${citation.chunkId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
