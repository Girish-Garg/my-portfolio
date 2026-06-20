import { describe, it, expect } from "vitest";
import { buildRegistry } from "./registry";
import type { Command } from "./types";

const cmds: Command[] = [
  { name: "help", summary: "list", run: () => ({ kind: "lines", lines: [] }) },
  { name: "projects", aliases: ["ls"], summary: "list", run: () => ({ kind: "lines", lines: [] }) },
];

describe("buildRegistry", () => {
  const reg = buildRegistry(cmds);

  it("knows a command by name", () => {
    expect(reg.isKnown("help")).toBe(true);
  });

  it("knows a command by alias, case-insensitively", () => {
    expect(reg.isKnown("LS")).toBe(true);
    expect(reg.get("ls")?.name).toBe("projects");
  });

  it("does not know an unregistered word", () => {
    expect(reg.isKnown("frobnicate")).toBe(false);
    expect(reg.get("frobnicate")).toBeUndefined();
  });

  it("lists all commands once", () => {
    expect(reg.all().map((c) => c.name)).toEqual(["help", "projects"]);
  });
});
