import {
  SearchRequestSchema,
  SearchResponseSchema,
  type SearchRequest,
  type SearchResponse,
} from "@paplet/shared";

const API_URL = import.meta.env.VITE_API_URL;

export const searchDocuments = async (
  request: SearchRequest,
): Promise<SearchResponse> => {
  const validatedRequest = SearchRequestSchema.parse(request);

  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.error ?? "Failed to retrieve search results");
  }

  const data: unknown = await response.json();

  return SearchResponseSchema.parse(data);
};
