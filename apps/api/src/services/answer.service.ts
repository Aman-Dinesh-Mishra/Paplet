import { AnswerSchema } from "@paplet/shared";
import { chat } from "../llm/groqClient.js";
import { answerSystemPrompt, buildAnswerPrompt } from "../prompts/answer.js";
import { validateCitations } from "./citation.service.js";
import type { RetrievedChunk } from "./retrieval.service.js";

export const SAFE_REFUSAL = {
  answer:
    "The retrieved research papers do not contain sufficient evidence to provide a reliable answer.",
  citations: [],
  is_answerable: false,
};

const MIN_RETRIEVAL_SIMILARITY = 0.15;

export const generateAnswer = async (
  question: string,
  chunks: RetrievedChunk[],
) => {
  if (chunks.length === 0) {
    return SAFE_REFUSAL;
  }

  const bestSimilarity = Math.max(...chunks.map((chunk) => chunk.similarity));

  if (bestSimilarity < MIN_RETRIEVAL_SIMILARITY) {
    return SAFE_REFUSAL;
  }

  const userPrompt = buildAnswerPrompt({
    question,
    chunks,
  });

  const generatedText = await chat({
    system: answerSystemPrompt,
    user: userPrompt,
  });

  let generatedAnswer: unknown;

  try {
    generatedAnswer = JSON.parse(generatedText);
  } catch {
    console.error("Groq returned invalid JSON:", generatedText);
    return SAFE_REFUSAL;
  }

  const validatedAnswer = AnswerSchema.safeParse(generatedAnswer);

  if (!validatedAnswer.success) {
    console.error(
      "Groq returned an invalid answer structure:",
      validatedAnswer.error.flatten(),
    );

    return SAFE_REFUSAL;
  }

  const citationValidation = validateCitations(validatedAnswer.data, chunks);

  if (!citationValidation.valid) {
    console.error("Citation validation failed:", {
      errors: citationValidation.errors,
      generatedCitations: validatedAnswer.data.citations,
      retrievedChunkIds: chunks.map((chunk) => chunk.id),
    });

    return SAFE_REFUSAL;
  }

  return validatedAnswer.data;
};
