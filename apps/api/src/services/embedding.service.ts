import { pipeline } from "@huggingface/transformers";
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSIONS = 384;
const BATCH_SIZE = 16;

type EmbeddingTensor = {
  tolist(): number[][];
};
type FeatureExtractionPipeline = (
  texts: string | string[],
  options: {
    pooling: "mean";
    normalize: boolean;
  },
) => Promise<EmbeddingTensor>;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID)
      .then((model) => model as unknown as FeatureExtractionPipeline)
      .catch((err) => {
        extractorPromise = null;
        throw err;
      });
  }
  return extractorPromise;
}

export async function initializeEmbeddingModel(): Promise<void> {
  await getEmbeddingPipeline();
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.trim();
  if (!input) {
    throw new Error("Cannot Generate an embedding for empty text");
  }
  const extractor = await getEmbeddingPipeline();

  const output = await extractor(input, {
    pooling: "mean",
    normalize: true,
  });
  const embedding = output.tolist()[0];
  if (
    !embedding ||
    embedding.length != EMBEDDING_DIMENSIONS ||
    !embedding.every(Number.isFinite)
  ) {
    throw new Error("Generated Embedding has an invalid format");
  }
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const inputs = texts.map((text, index) => {
    const input = text.trim();

    if (!input) {
      throw new Error(`Text at index ${index} is empty`);
    }

    return input;
  });

  const extractor = await getEmbeddingPipeline();
  const embeddings: number[][] = [];

  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);

    const output = await extractor(batch, {
      pooling: "mean",
      normalize: true,
    });

    const batchEmbeddings = output.tolist();

    if (batchEmbeddings.length !== batch.length) {
      throw new Error("Generated embedding count does not match batch size");
    }

    for (const embedding of batchEmbeddings) {
      if (
        embedding.length !== EMBEDDING_DIMENSIONS ||
        !embedding.every(Number.isFinite)
      ) {
        throw new Error("Generated embedding has an invalid format");
      }
    }

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}
