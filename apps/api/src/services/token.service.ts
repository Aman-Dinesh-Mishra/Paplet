export function countTokens(text: string): number {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return 0;
  }
  const wordCount = trimmedText.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3);
}
