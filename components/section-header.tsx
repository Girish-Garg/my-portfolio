import { Reveal } from "./reveal";

type SectionHeaderProps = {
  /** 1-based position of this section. */
  index: number;
  /** Total number of indexed sections. */
  total: number;
  /** Large display title. */
  title: string;
  /** Short uppercase code shown on the left of the strip (e.g. "WORK"). */
  code: string;
  /** Optional trailing detail shown under the title (e.g. a count). */
  note?: string;
};

/**
 * The blueprint section header used across the page. A monospaced index strip
 * (code · drawing rule · NN / TOTAL) sits above a confident display title, so
 * every section reads like a numbered entry in an engineering log.
 */
export function SectionHeader({
  index,
  total,
  title,
  code,
  note,
}: SectionHeaderProps) {
  const nn = String(index).padStart(2, "0");
  const tt = String(total).padStart(2, "0");

  return (
    <Reveal>
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em]">
        <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
        <span className="text-muted">{code}</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="text-faint tabular-nums">
          <span className="text-accent">{nn}</span> / {tt}
        </span>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[2.75rem]">
          {title}
        </h2>
        {note && (
          <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-faint">
            {note}
          </span>
        )}
      </div>
    </Reveal>
  );
}
