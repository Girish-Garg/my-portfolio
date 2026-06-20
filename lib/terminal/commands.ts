import {
  profile,
  bio,
  skills,
  projects,
  sections,
  type CollectionItem,
} from "@/content/portfolio";
import type { Command, OutputLine } from "./types";

const isReal = (url?: string) => !!url && !url.startsWith("REPLACE");
const line = (text: string, tone?: OutputLine["tone"], href?: string): OutputLine => ({ text, tone, href });

function findProject(token: string) {
  const t = token.toLowerCase();
  return projects.find(
    (p) => p.slug.toLowerCase() === t || p.title.toLowerCase() === t,
  );
}

export const commands: Command[] = [
  {
    name: "help",
    summary: "list everything you can run",
    run: () => ({
      kind: "lines",
      lines: [
        line("commands:", "muted"),
        ...commands.map((c) => line(`  ${c.name.padEnd(11)} ${c.summary}`)),
        line("tip: type a question to ask the AI, or run a command.", "muted"),
      ],
    }),
  },
  {
    name: "projects",
    aliases: ["ls"],
    summary: "list projects (--featured, --systems)",
    run: (args) => {
      let list = projects;
      if (args.includes("--featured")) list = list.filter((p) => p.featured);
      if (args.includes("--systems")) list = list.filter((p) => p.tags?.includes("systems"));
      if (list.length === 0) return { kind: "lines", lines: [line("no projects match.", "muted")] };
      return {
        kind: "lines",
        lines: list.flatMap((p) => [
          line(`${p.title}${p.year ? `  (${p.year})` : ""}`, "accent"),
          line(`  ${p.blurb}`, "muted"),
          line(`  ${p.stack.join(" / ")}`, "muted"),
        ]),
      };
    },
  },
  {
    name: "open",
    aliases: ["cat"],
    summary: "open a project, e.g. open animy",
    run: (args) => {
      const token = args[0];
      if (!token) return { kind: "lines", lines: [line("usage: open <project>", "muted")] };
      if (token.toLowerCase() === "resume") {
        return {
          kind: "action",
          lines: [line("opening resume...", "muted")],
          action: { type: "open", url: profile.resumeUrl, label: "Resume" },
        };
      }
      const p = findProject(token);
      if (!p) return { kind: "lines", lines: [line(`no project named "${token}". try: projects`, "error")] };
      const url = isReal(p.liveUrl) ? p.liveUrl! : isReal(p.repoUrl) ? p.repoUrl! : "";
      if (!url) return { kind: "lines", lines: [line(`${p.title} has no public link yet.`, "muted")] };
      return {
        kind: "action",
        lines: [line(`opening ${p.title}...`, "muted")],
        action: { type: "open", url, label: p.title },
      };
    },
  },
  {
    name: "about",
    summary: "who I am",
    run: () => ({ kind: "lines", lines: [line(bio)] }),
  },
  {
    name: "skills",
    summary: "what I work with",
    run: () => ({
      kind: "lines",
      lines: skills.map((g) => line(`${g.group}: ${g.items.join(", ")}`)),
    }),
  },
  {
    name: "experience",
    summary: "open-source and clubs",
    run: () => {
      const items = sections
        .filter((s) => s.type === "collection" && s.items?.length)
        .flatMap((s) => s.items as CollectionItem[]);
      if (items.length === 0) return { kind: "lines", lines: [line("nothing logged here yet.", "muted")] };
      return {
        kind: "lines",
        lines: items.flatMap((it) => [
          line(`${it.title}${it.meta ? `  (${it.meta})` : ""}`, "accent"),
          ...(it.blurb ? [line(`  ${it.blurb}`, "muted")] : []),
        ]),
      };
    },
  },
  {
    name: "resume",
    summary: "open my resume (pdf)",
    run: () => ({
      kind: "action",
      lines: [line("opening resume...", "muted")],
      action: { type: "open", url: profile.resumeUrl, label: "Resume" },
    }),
  },
  {
    name: "contact",
    aliases: ["email"],
    summary: "how to reach me",
    run: () => ({
      kind: "lines",
      lines: [
        line(`email: ${profile.email}`, "accent", `mailto:${profile.email}`),
        ...profile.socials
          .filter((s) => isReal(s.href))
          .map((s) => line(`${s.label.toLowerCase()}: ${s.href}`, "accent", s.href)),
      ],
    }),
  },
  {
    name: "socials",
    summary: "links",
    run: () => {
      const real = profile.socials.filter((s) => isReal(s.href));
      if (real.length === 0) return { kind: "lines", lines: [line("no links yet - try contact.", "muted")] };
      return { kind: "lines", lines: real.map((s) => line(`${s.label.toLowerCase()}: ${s.href}`, "accent", s.href)) };
    },
  },
  {
    name: "theme",
    summary: "switch theme [dark|light]",
    run: (args) => {
      const v = args[0]?.toLowerCase();
      const value = v === "dark" || v === "light" ? v : undefined;
      return {
        kind: "action",
        lines: [line(`theme ${value ?? "toggled"}.`, "muted")],
        action: { type: "theme", value },
      };
    },
  },
  {
    name: "fullscreen",
    summary: "expand the terminal",
    run: () => ({ kind: "action", action: { type: "fullscreen" } }),
  },
  {
    name: "clear",
    summary: "clear the screen",
    run: () => ({ kind: "action", action: { type: "clear" } }),
  },
  {
    name: "ask",
    summary: 'ask the AI, e.g. ask "what is animy?"',
    run: (args) => {
      const question = args.join(" ").replace(/^["']|["']$/g, "").trim();
      return { kind: "ask", question };
    },
  },
];
