import {
  SearchRequestSchema,
  SearchResponseSchema,
  type SearchRequest,
  type SearchResponse,
} from "@paplet/shared";
import { apiFetch } from "./api";

export const searchDocuments = async (
  request: SearchRequest,
): Promise<SearchResponse> => {
  const validatedRequest = SearchRequestSchema.parse(request);

  const response = await apiFetch("/search", {
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
