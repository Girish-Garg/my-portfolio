export type OutputTone = "default" | "muted" | "accent" | "ok" | "error";

export type OutputLine = { text: string; tone?: OutputTone; href?: string };

export type TerminalAction =
  | { type: "clear" }
  | { type: "theme"; value?: "dark" | "light" }
  | { type: "fullscreen"; value?: boolean }
  | { type: "open"; url: string; label: string };

export type CommandOutput =
  | { kind: "lines"; lines: OutputLine[] }
  | { kind: "action"; lines?: OutputLine[]; action: TerminalAction }
  | { kind: "ask"; question: string };

export type Command = {
  name: string;
  aliases?: string[];
  summary: string;
  run: (args: string[]) => CommandOutput;
};

export type ParsedInput =
  | { kind: "empty" }
  | { kind: "command"; name: string; args: string[] }
  | { kind: "freeText"; text: string };
