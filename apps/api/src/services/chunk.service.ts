import { countTokens } from "./token.service.js";

type PageSentence = {
  content: string;
  page: number;
};

type ChunkOptions = {
  targetTokens: number;
  maxTokens: number;
  overlapRatio: number;
};

const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  targetTokens: 220,
  maxTokens: 256,
  overlapRatio: 0.12,
};

export type DocumentChunk = {
  content: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  tokenCount: number;
};

function splitPagesIntoSentences(pages: string[]): PageSentence[] {
  const segmenter = new Intl.Segmenter("en", {
    granularity: "sentence",
  });

  const sentences: PageSentence[] = [];

  pages.forEach((pageText, pageIndex) => {
    const text = pageText.trim();

    if (!text) return;

    for (const segment of segmenter.segment(text)) {
      const content = segment.segment.trim();

      if (!content) continue;

      sentences.push({
        content,
        page: pageIndex + 1,
      });
    }
  });

  return sentences;
}

function splitLongSentence(
  sentence: PageSentence,
  maxTokens: number,
): PageSentence[] {
  const words = sentence.content.split(/\s+/);
  const parts: PageSentence[] = [];
  let currentWords: string[] = [];

  for (const word of words) {
    const candidate = [...currentWords, word].join(" ");

    if (currentWords.length > 0 && countTokens(candidate) > maxTokens) {
      parts.push({
        content: currentWords.join(" "),
        page: sentence.page,
      });

      currentWords = [word];
    } else {
      currentWords.push(word);
    }
  }

  if (currentWords.length > 0) {
    parts.push({
      content: currentWords.join(" "),
      page: sentence.page,
    });
  }

  return parts;
}

function packSentences(
  sentences: PageSentence[],
  options: ChunkOptions,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let start = 0;

  while (start < sentences.length) {
    const currentSentences: PageSentence[] = [];
    let currentContent = "";

    for (let i = start; i < sentences.length; i++) {
      const candidate = currentContent
        ? `${currentContent} ${sentences[i].content}`
        : sentences[i].content;

      const candidateTokens = countTokens(candidate);

      if (
        currentSentences.length > 0 &&
        candidateTokens > options.targetTokens
      ) {
        break;
      }

      currentSentences.push(sentences[i]);
      currentContent = candidate;

      if (candidateTokens >= options.targetTokens) {
        break;
      }
    }

    const content = currentSentences
      .map((sentence) => sentence.content)
      .join(" ");

    const pages = currentSentences.map((sentence) => sentence.page);

    chunks.push({
      content,
      pageStart: Math.min(...pages),
      pageEnd: Math.max(...pages),
      chunkIndex: chunks.length,
      tokenCount: countTokens(content),
    });

    // Do not create another chunk when all sentences are consumed.
    if (start + currentSentences.length >= sentences.length) {
      break;
    }

    const overlapBudget = Math.floor(
      options.targetTokens * options.overlapRatio,
    );

    let overlapCount = 0;
    let overlapTokens = 0;

    for (let i = currentSentences.length - 1; i >= 1; i--) {
      const sentenceTokens = countTokens(currentSentences[i].content);

      if (overlapCount > 0 && overlapTokens + sentenceTokens > overlapBudget) {
        break;
      }

      if (overlapCount === 0 && sentenceTokens > overlapBudget) {
        break;
      }

      overlapTokens += sentenceTokens;
      overlapCount++;
    }

    const nextStart = start + currentSentences.length - overlapCount;

    if (nextStart <= start) break;

    start = nextStart;
  }

  return chunks;
}

export function createChunks(
  pages: string[],
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS,
): DocumentChunk[] {
  if (
    !Number.isFinite(options.targetTokens) ||
    !Number.isInteger(options.targetTokens) ||
    !Number.isFinite(options.maxTokens) ||
    !Number.isInteger(options.maxTokens) ||
    options.targetTokens <= 0 ||
    options.maxTokens <= 0 ||
    options.targetTokens > options.maxTokens ||
    !Number.isFinite(options.overlapRatio) ||
    options.overlapRatio < 0 ||
    options.overlapRatio >= 1
  ) {
    throw new Error("Invalid chunking options");
  }

  const sentences = splitPagesIntoSentences(pages);

  const preparedSentences = sentences.flatMap((sentence) =>
    countTokens(sentence.content) > options.maxTokens
      ? splitLongSentence(sentence, options.maxTokens)
      : [sentence],
  );

  return packSentences(preparedSentences, options);
}
