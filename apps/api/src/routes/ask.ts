import { Router } from "express";
import { AskRequestSchema, AnswerSchema } from "@paplet/shared";
import { pool } from "../db/pool.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { chat } from "../llm/groqClient.js";
import { answerSystemPrompt, buildAnswerPrompt } from "../prompts/answer.js";
import { validateCitations } from "../services/citation.service.js";

const router = Router();

const SAFE_REFUSAL = {
  answer:
    "The retrieved research papers do not contain sufficient evidence to provide a reliable answer.",
  citations: [],
  is_answerable: false,
};

const MIN_RETRIEVAL_SIMILARITY = 0.15;

router.post("/", async (req, res) => {
  const parsed = AskRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid ask request",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { question, paperIds } = parsed.data;

    const embedding = await generateEmbedding(question);

    const result = await pool.query(
      `SELECT *
       FROM match_chunks(
         $1::VECTOR,
         $2::INTEGER,
         $3::UUID[]
       )`,
      [`[${embedding.join(",")}]`, 5, paperIds ?? null],
    );

    const chunks = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      pageStart: row.page_start,
      pageEnd: row.page_end,
      similarity: Number(row.similarity),
    }));

    if (chunks.length === 0) {
      res.status(200).json(SAFE_REFUSAL);
      return;
    }

    const bestSimilarity = Math.max(...chunks.map((chunk) => chunk.similarity));

    if (bestSimilarity < MIN_RETRIEVAL_SIMILARITY) {
      console.log("Retrieval similarity below threshold:", bestSimilarity);

      res.status(200).json(SAFE_REFUSAL);
      return;
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

      res.status(200).json(SAFE_REFUSAL);
      return;
    }

    const validatedAnswer = AnswerSchema.safeParse(generatedAnswer);

    if (!validatedAnswer.success) {
      console.error(
        "Groq returned an invalid answer structure:",
        validatedAnswer.error.flatten(),
      );

      res.status(200).json(SAFE_REFUSAL);
      return;
    }

    const citationValidation = validateCitations(validatedAnswer.data, chunks);

    if (!citationValidation.valid) {
      console.error("Citation validation failed:", {
        errors: citationValidation.errors,
        generatedCitations: validatedAnswer.data.citations,
        retrievedChunkIds: chunks.map((chunk) => chunk.id),
      });

      res.status(200).json(SAFE_REFUSAL);
      return;
    }

    res.status(200).json(validatedAnswer.data);
  } catch (error) {
    console.error("Answer generation failed:", error);

    res.status(500).json({
      error: "Answer generation failed",
    });
  }
});

export default router;
