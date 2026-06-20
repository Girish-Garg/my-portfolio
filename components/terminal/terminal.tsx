"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { profile, chat } from "@/content/portfolio";
import { parseInput } from "@/lib/terminal/parse";
import { buildRegistry } from "@/lib/terminal/registry";
import { commands } from "@/lib/terminal/commands";
import type { OutputLine, TerminalAction } from "@/lib/terminal/types";

const FIRST_NAME = profile.name.split(" ")[0];
const HANDLE = `ask-${FIRST_NAME.toLowerCase()}`;
const ASK_BUDGET = 5;
const FALLBACK = `I'm offline at the moment. Email me at ${profile.email} and I'll reply directly.`;
const registry = buildRegistry(commands);

type Entry =
  | { kind: "input"; text: string }
  | { kind: "output"; lines: OutputLine[] }
  | { kind: "ask-pending" }
  | { kind: "ask-answer"; text: string };

const toneClass: Record<NonNullable<OutputLine["tone"]>, string> = {
  default: "text-ink",
  muted: "text-muted",
  accent: "text-accent",
  ok: "text-ok",
  error: "text-red-400",
};

export function Terminal() {
  const [value, setValue] = useState("");
  const [log, setLog] = useState<Entry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [asksLeft, setAsksLeft] = useState(ASK_BUDGET);
  const [full, setFull] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);

  const push = (e: Entry) => setLog((prev) => [...prev, e]);
  const scrollToEnd = () =>
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

  function applyAction(action: TerminalAction) {
    switch (action.type) {
      case "clear":
        setLog([]);
        return;
      case "theme": {
        const isDark = document.documentElement.classList.contains("dark");
        const next = action.value ?? (isDark ? "light" : "dark");
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem("theme", next);
        return;
      }
      case "open":
        window.open(action.url, "_blank", "noopener,noreferrer");
        return;
      case "fullscreen":
        setFull((v) => action.value ?? !v);
        return;
    }
  }

  function submit(raw: string) {
    if (streaming) return;
    const parsed = parseInput(raw, registry.isKnown);
    if (parsed.kind === "empty") return;
    push({ kind: "input", text: raw.trim() });
    setValue("");

    if (parsed.kind === "freeText") {
      void runAsk(parsed.text);
      scrollToEnd();
      return;
    }

    const out = registry.get(parsed.name)!.run(parsed.args);
    if (out.kind === "ask") {
      void runAsk(out.question);
    } else {
      if (out.lines?.length) push({ kind: "output", lines: out.lines });
      if (out.kind === "action") applyAction(out.action);
    }
    scrollToEnd();
  }

  async function runAsk(question: string) {
    if (!question) {
      push({ kind: "output", lines: [{ text: 'usage: ask "your question"', tone: "muted" }] });
      return;
    }
    if (asksLeft <= 0) {
      push({
        kind: "output",
        lines: [
          { text: "AI limit reached for this visit (it runs on a small free tier).", tone: "muted" },
          { text: `Try a command like projects or contact, or email ${profile.email}.`, tone: "muted" },
        ],
      });
      return;
    }
    setAsksLeft((n) => n - 1);

    push({ kind: "ask-pending" });
    setStreaming(true);
    scrollToEnd();

    const setAnswer = (text: string) =>
      setLog((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { kind: "ask-answer", text };
        return next;
      });

    let received = "";
    let displayed = 0;
    let streamDone = false;
    let halted = false;

    const tick = () => {
      if (halted) return;
      if (displayed < received.length) {
        const backlog = received.length - displayed;
        const step = Math.max(2, Math.min(8, Math.ceil(backlog / 30)));
        displayed = Math.min(received.length, displayed + step);
        setAnswer(received.slice(0, displayed));
        scrollToEnd();
      }
      if (!streamDone || displayed < received.length) {
        requestAnimationFrame(tick);
      } else {
        setStreaming(false);
        scrollToEnd();
      }
    };
    requestAnimationFrame(tick);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: question }] }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        halted = true;
        setAnswer(data?.message ?? FALLBACK);
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        received += decoder.decode(chunk, { stream: true });
      }
      if (!received.trim()) {
        halted = true;
        setAnswer(FALLBACK);
        setStreaming(false);
        return;
      }
      streamDone = true;
    } catch {
      halted = true;
      setAnswer(FALLBACK);
      setStreaming(false);
    }
  }

  // Press "/" anywhere to jump into the prompt (ignored while already typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The native caret and text are hidden; an accent block caret in the overlay
  // stands in. Mirror the input's horizontal scroll so the block caret keeps
  // tracking the text once a long line scrolls past the visible width.
  useEffect(() => {
    const input = inputRef.current;
    const overlay = overlayRef.current;
    if (!input || !overlay) return;
    const sync = () => {
      overlay.style.transform = `translateX(${-input.scrollLeft}px)`;
    };
    input.addEventListener("scroll", sync);
    return () => input.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    const overlay = overlayRef.current;
    if (input && overlay) {
      overlay.style.transform = `translateX(${-input.scrollLeft}px)`;
    }
  }, [value]);

  // Esc leaves fullscreen; lock body scroll while the overlay is up.
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  const panel = (
    <div className="glow-accent flex min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      {/* Console header. */}
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <span aria-hidden className="dot dot-live text-ok" />
          <span>{HANDLE}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
          {streaming ? (
            <span className="text-accent">working</span>
          ) : (
            <>
              {asksLeft < ASK_BUDGET && (
                <span className="text-faint">{asksLeft} asks left</span>
              )}
              {log.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLog([])}
                  className="touch-manipulation text-faint transition-colors hover:text-ink"
                >
                  clear
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => setFull((v) => !v)}
            aria-label={full ? "Exit fullscreen" : "Expand to fullscreen"}
            className="touch-manipulation text-faint transition-colors hover:text-ink"
          >
            {full ? "×" : "⤢"}
          </button>
        </div>
      </div>

      {/* Conversation / output log. */}
      <div
        ref={scrollRef}
        aria-live="polite"
        className={`scroll-thin space-y-3 overflow-y-auto px-4 py-4 font-mono text-sm ${
          full ? "max-h-[70vh] flex-1" : "max-h-[20rem]"
        }`}
      >
        {log.length === 0 && (
          <p className="text-muted">
            Type <span className="text-accent">help</span>, or ask a question.
          </p>
        )}
        {log.map((e, i) => {
          if (e.kind === "input") {
            return (
              <p key={i} className="text-ink">
                <span className="text-accent">&#10095;</span> {e.text}
              </p>
            );
          }
          if (e.kind === "output") {
            return (
              <div key={i} className="space-y-0.5">
                {e.lines.map((l, j) => {
                  const cls = `whitespace-pre-wrap leading-relaxed ${toneClass[l.tone ?? "default"]}`;
                  if (l.href) {
                    const external = l.href.startsWith("http");
                    return (
                      <a
                        key={j}
                        href={l.href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={`${cls} block w-fit underline decoration-1 underline-offset-2 transition-opacity hover:opacity-80`}
                      >
                        {l.text}
                        {external ? " ↗" : ""}
                      </a>
                    );
                  }
                  return (
                    <p key={j} className={cls}>
                      {l.text}
                    </p>
                  );
                })}
              </div>
            );
          }
          if (e.kind === "ask-pending") {
            return (
              <p key={i} className="text-muted">
                thinking <span aria-hidden className="caret" />
              </p>
            );
          }
          return (
            <p key={i} className="whitespace-pre-wrap leading-relaxed text-ink">
              <span className="text-accent">{FIRST_NAME} </span>
              {e.text}
              {streaming && i === log.length - 1 && <span aria-hidden className="caret" />}
            </p>
          );
        })}
      </div>

      {/* Prompt. */}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2.5 border-t border-line px-4 py-3 transition-colors focus-within:bg-surface-2/40"
      >
        <span
          aria-hidden
          className="term-prompt select-none font-mono text-lg font-bold leading-none"
        >
          &#10095;
        </span>
        <label htmlFor="ask" className="sr-only">
          {chat.placeholder}
        </label>
        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
          <input
            id="ask"
            ref={inputRef}
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            className="term-input peer w-full touch-manipulation bg-transparent pr-2 font-mono text-base text-transparent caret-transparent focus:outline-none"
            autoComplete="off"
            maxLength={500}
            disabled={streaming}
          />
          {/* The block caret leads the line: it trails the text as you type,
              standing in for the hidden native caret. */}
          <span
            ref={overlayRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center font-mono text-base"
          >
            <span className="shrink-0 whitespace-pre text-ink">{value}</span>
            <span className="caret shrink-0" />
            {!value && (
              <span className="ml-2 shrink-0 whitespace-nowrap text-muted/50">
                {chat.placeholder}
              </span>
            )}
          </span>
        </div>
      </form>
    </div>
  );

  return (
    <div className="w-full">
      {/* Inline: the panel when docked, a placeholder while expanded so the hero
          layout does not collapse. */}
      {full ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center font-mono text-xs uppercase tracking-[0.14em] text-faint">
          terminal expanded - press esc to return
        </div>
      ) : (
        panel
      )}

      {/* Fullscreen: portal to the body so it escapes the hero's transformed
          ancestor (which would otherwise be the containing block for fixed). */}
      {full &&
        createPortal(
          <div className="term-overlay-enter fixed inset-0 z-[60] flex flex-col bg-base p-4 sm:p-8 md:p-12">
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">{panel}</div>
          </div>,
          document.body,
        )}

      {/* Suggestion commands. */}
      {!full && log.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chat.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="group inline-flex touch-manipulation items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-ink"
            >
              <span
                aria-hidden
                className="text-accent/70 transition-colors group-hover:text-accent"
              >
                &#10095;
              </span>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
