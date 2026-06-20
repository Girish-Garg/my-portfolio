import type { ParsedInput } from "./types";

export function parseInput(
  raw: string,
  isKnown: (name: string) => boolean,
): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" };

  const parts = trimmed.split(/\s+/);
  const verb = parts[0]!.toLowerCase();

  if (isKnown(verb)) {
    return { kind: "command", name: verb, args: parts.slice(1) };
  }
  return { kind: "freeText", text: trimmed };
}
