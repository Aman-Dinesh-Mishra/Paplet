import { Router } from "express";
import { AskRequestSchema, AnswerSchema } from "@paplet/shared";
import { pool } from "../db/pool.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { chat } from "../llm/groqClient.js";
import { answerSystemPrompt, buildAnswerPrompt } from "../prompts/answer.js";

const router = Router();

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
    }));

    if (chunks.length === 0) {
      res.status(200).json({
        answer:
          "The retrieved research papers do not contain sufficient evidence to answer this question.",
        citations: [],
        is_answerable: false,
      });
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
      res.status(502).json({
        error: "The language model returned invalid JSON",
      });
      return;
    }

    const validatedAnswer = AnswerSchema.safeParse(generatedAnswer);

    if (!validatedAnswer.success) {
      res.status(502).json({
        error: "The language model returned an invalid answer structure",
        details: validatedAnswer.error.flatten(),
      });
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
