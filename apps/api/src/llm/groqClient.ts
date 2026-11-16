import Groq from "groq-sdk";
import { withRetry } from "../services/retry.service.js";

type ChatInput = {
  system: string;
  user: string;
};

let client: Groq | null = null;

const getClient = (): Groq => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY isn't configured");
  }

  if (!client) {
    client = new Groq({
      apiKey,
      timeout: 30_000,
      maxRetries: 0,
    });
  }

  return client;
};

export const chat = async ({ system, user }: ChatInput): Promise<string> => {
  const model = process.env.LLM_MODEL;

  if (!model) {
    throw new Error("LLM_MODEL isn't configured");
  }

  const completion = await withRetry(
    () =>
      getClient().chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0,
        reasoning_effort: "low",
        max_completion_tokens: 2048,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "paplet_answer",
            strict: true,
            schema: {
              type: "object",
              properties: {
                answer: {
                  type: "string",
                },
                citations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      chunkId: {
                        type: "string",
                      },
                      quote: {
                        type: "string",
                      },
                    },
                    required: ["chunkId", "quote"],
                    additionalProperties: false,
                  },
                },
                is_answerable: {
                  type: "boolean",
                },
              },
              required: ["answer", "citations", "is_answerable"],
              additionalProperties: false,
            },
          },
        },
      }),
    {
      maxAttempts: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      deadlineMs: 60000,
    },
  );

  const content = completion.choices[0]?.message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned an empty response");
  }

  return content.trim();
};
