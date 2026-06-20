import { describe, it, expect } from "vitest";
import { parseInput } from "./parse";

const known = (n: string) => ["help", "projects", "ask"].includes(n);

describe("parseInput", () => {
  it("returns empty for blank input", () => {
    expect(parseInput("   ", known)).toEqual({ kind: "empty" });
  });

  it("parses a known verb with args", () => {
    expect(parseInput("projects --featured", known)).toEqual({
      kind: "command",
      name: "projects",
      args: ["--featured"],
    });
  });

  it("is case-insensitive on the verb", () => {
    expect(parseInput("HELP", known)).toEqual({ kind: "command", name: "help", args: [] });
  });

  it("treats an unknown first word as free text", () => {
    expect(parseInput("what is your strongest project?", known)).toEqual({
      kind: "freeText",
      text: "what is your strongest project?",
    });
  });

  it("keeps quoted ask questions intact as args", () => {
    expect(parseInput('ask "are you free?"', known)).toEqual({
      kind: "command",
      name: "ask",
      args: ['"are', "you", 'free?"'],
    });
  });
});
