import { describe, it, expect } from "vitest";
import { commands } from "./commands";
import { buildRegistry } from "./registry";

const reg = buildRegistry(commands);
const run = (name: string, args: string[] = []) => reg.get(name)!.run(args);
const flat = (name: string, args: string[] = []) => {
  const out = run(name, args);
  return out.kind === "lines" || out.kind === "action"
    ? (out.lines ?? []).map((l) => l.text).join("\n")
    : "";
};

describe("commands", () => {
  it("help lists every command name", () => {
    const text = flat("help");
    for (const c of commands) expect(text).toContain(c.name);
  });

  it("projects lists titles", () => {
    expect(flat("projects")).toContain("ANIMY");
  });

  it("projects --systems filters by tag", () => {
    const text = flat("projects", ["--systems"]);
    expect(text).toContain("Build My Own Git");
    expect(text).not.toContain("Maap");
  });

  it("open resolves a project to an open action", () => {
    const out = run("open", ["animy"]);
    expect(out.kind).toBe("action");
    if (out.kind === "action") {
      expect(out.action).toMatchObject({ type: "open" });
    }
  });

  it("open reports an error for an unknown name", () => {
    const out = run("open", ["nope"]);
    expect(out.kind === "lines" && out.lines[0]!.tone).toBe("error");
  });

  it("theme returns a theme action", () => {
    const out = run("theme", ["light"]);
    expect(out.kind === "action" && out.action).toMatchObject({ type: "theme", value: "light" });
  });

  it("ask returns the question", () => {
    const out = run("ask", ["are", "you", "free?"]);
    expect(out).toEqual({ kind: "ask", question: "are you free?" });
  });
});
