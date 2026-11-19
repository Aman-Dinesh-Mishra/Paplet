import {
  AskRequestSchema,
  AnswerSchema,
  type AskRequest,
  type Answer,
} from "@paplet/shared";
import { apiFetch } from "./api";

export const askQuestion = async (request: AskRequest): Promise<Answer> => {
  const validatedRequest = AskRequestSchema.parse(request);

  const response = await apiFetch("/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Failed to generate an answer");
  }

  const data: unknown = await response.json();

  return AnswerSchema.parse(data);
};
