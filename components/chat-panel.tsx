"use client";

import { useEffect, useRef, useState } from "react";
import { profile, chat } from "@/content/portfolio";

type Turn = { role: "user" | "model"; text: string };

const MAX_INPUT = 500;
const FIRST_NAME = profile.name.split(" ")[0];
const HANDLE = `ask-${FIRST_NAME.toLowerCase()}`;
const FALLBACK = `I'm offline at the moment. Email me at ${profile.email} and I'll reply directly.`;

export function ChatPanel() {
  const [value, setValue] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);

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

  // The native caret and text are hidden; a block caret in the overlay stands
  // in for them. Mirror the input's horizontal scroll so that block caret keeps
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

  function scrollToEnd() {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function reset() {
    if (streaming) return;
    setTurns([]);
    setValue("");
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const outgoing: Turn[] = [...turns, { role: "user", text: trimmed }];
    setTurns([...outgoing, { role: "model", text: "" }]);
    setValue("");
    setStreaming(true);
    scrollToEnd();

    const setReply = (reply: string) =>
      setTurns((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { role: "model", text: reply };
        return next;
      });

    // Decouple visible reveal from network arrival. Gemini batches short
    // replies, so the whole response often lands in one chunk under 200ms -
    // a real "streaming" pipeline that still looks like a paste. The reader
    // fills `received` in the background; a RAF loop advances `displayed` at
    // a typewriter cadence so the user sees text materialise either way.
    let received = "";
    let displayed = 0;
    let streamDone = false;
    let halted = false;

    const tick = () => {
      if (halted) return;
      if (displayed < received.length) {
        const backlog = received.length - displayed;
        // ~120 chars/sec at idle; accelerate up to ~500 chars/sec when the
        // buffer is far ahead so a one-shot response doesn't trail forever.
        const step = Math.max(2, Math.min(8, Math.ceil(backlog / 30)));
        displayed = Math.min(received.length, displayed + step);
        setReply(received.slice(0, displayed));
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
        body: JSON.stringify({ messages: outgoing }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        halted = true;
        setReply(data?.message ?? FALLBACK);
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
        setReply(FALLBACK);
        setStreaming(false);
        return;
      }
      streamDone = true;
    } catch {
      halted = true;
      setReply(FALLBACK);
      setStreaming(false);
    }
  }

  return (
    <div className="w-full">
      <div className="glow-accent overflow-hidden rounded-lg border border-line bg-surface">
        {/* Console header. */}
        <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span aria-hidden className="dot dot-live text-ok" />
            <span>{HANDLE}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em]">
            {streaming ? (
              <span className="text-accent">working</span>
            ) : turns.length > 0 ? (
              <button
                type="button"
                onClick={reset}
                className="touch-manipulation text-faint transition-colors hover:text-ink"
              >
                clear
              </button>
            ) : (
              <span className="text-faint">ready</span>
            )}
          </div>
        </div>

        {/* Conversation log. */}
        {turns.length > 0 && (
          <div
            ref={scrollRef}
            aria-live="polite"
            className="scroll-thin max-h-[20rem] space-y-5 overflow-y-auto px-4 py-4"
          >
            {turns.map((t, i) => {
              const isLast = i === turns.length - 1;
              const pending = streaming && isLast && t.text.length === 0;
              const live = streaming && isLast && t.text.length > 0;
              return (
                <div key={i}>
                  <p
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                      t.role === "user" ? "text-faint" : "text-accent"
                    }`}
                  >
                    {t.role === "user" ? "You" : FIRST_NAME}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {pending ? (
                      <span className="text-muted">
                        thinking <span aria-hidden className="caret" />
                      </span>
                    ) : (
                      <>
                        {t.text}
                        {live && <span aria-hidden className="caret" />}
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Idle greeting - reads as a live console, not an empty box. */}
        {turns.length === 0 && (
          <div className="px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              {FIRST_NAME}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Ask about my projects, the stack I use, or how to reach me.
            </p>
          </div>
        )}

        {/* Prompt. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(value);
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
              onChange={(e) => setValue(e.target.value)}
              className="term-input peer w-full touch-manipulation bg-transparent pr-2 font-mono text-base text-transparent caret-transparent focus:outline-none"
              autoComplete="off"
              maxLength={MAX_INPUT}
              disabled={streaming}
            />
            {/* The block caret leads the line: it sits at the start when the
                prompt is empty and trails the text as you type, standing in for
                the hidden native caret so the visible cursor is the solid block. */}
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
          <button
            type="submit"
            disabled={streaming || !value.trim()}
            aria-label="Send message"
            className="shrink-0 touch-manipulation rounded px-1.5 py-1 font-mono text-lg leading-none text-faint transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none disabled:opacity-30"
          >
            &#8629;
          </button>
        </form>
      </div>

      {/* Suggestion commands. */}
      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chat.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="group inline-flex touch-manipulation items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-ink"
            >
              <span aria-hidden className="text-accent/70 transition-colors group-hover:text-accent">
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
