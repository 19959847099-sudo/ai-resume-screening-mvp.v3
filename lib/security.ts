export function parseJsonSafely<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

export function cleanText(input: string): string {
  return input.replace(/\u0000/g, "").trim();
}
