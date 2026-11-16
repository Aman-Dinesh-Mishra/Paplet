import Groq from "groq-sdk";

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

  const completion = await getClient().chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0,
    max_completion_tokens: 1024,
    response_format: {
      type: "json_object",
    },
  });

  const content = completion.choices[0]?.message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned an empty response");
  }

  return content.trim();
};
