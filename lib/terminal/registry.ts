import type { Command } from "./types";

export type Registry = {
  isKnown: (name: string) => boolean;
  get: (name: string) => Command | undefined;
  all: () => Command[];
};

export function buildRegistry(commands: Command[]): Registry {
  const byName = new Map<string, Command>();
  for (const c of commands) {
    byName.set(c.name.toLowerCase(), c);
    for (const a of c.aliases ?? []) byName.set(a.toLowerCase(), c);
  }
  return {
    isKnown: (name) => byName.has(name.toLowerCase()),
    get: (name) => byName.get(name.toLowerCase()),
    all: () => commands,
  };
}
