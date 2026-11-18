import { z } from "zod";

const AnswerableQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().min(1),
  type: z.literal("answerable"),
  goldDocument: z.string().uuid(),
  goldPages: z.array(z.number().int().positive()).min(1),
  goldQuote: z.string().trim().min(1).optional(),
});

const UnanswerableQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().min(1),
  type: z.literal("unanswerable"),
  goldDocument: z.null(),
  goldPages: z.array(z.number()).length(0),
});

export const EvaluationQuestionSchema = z.discriminatedUnion("type", [
  AnswerableQuestionSchema,
  UnanswerableQuestionSchema,
]);

export const EvaluationDatasetSchema = z
  .array(EvaluationQuestionSchema)
  .min(1)
  .superRefine((questions, ctx) => {
    const ids = new Set<string>();

    questions.forEach((question, index) => {
      if (ids.has(question.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate question ID: ${question.id}`,
          path: [index, "id"],
        });
      }

      ids.add(question.id);
    });
  });

export type EvaluationQuestion = z.infer<typeof EvaluationQuestionSchema>;

export type EvaluationDataset = z.infer<typeof EvaluationDatasetSchema>;
