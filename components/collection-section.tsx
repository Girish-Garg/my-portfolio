import type { CollectionItem } from "@/content/portfolio";
import { SectionHeader } from "./section-header";
import { Reveal } from "./reveal";

function ItemContent({ item }: { item: CollectionItem }) {
  return (
    <div className="grid gap-2 py-6 md:grid-cols-12 md:gap-8">
      {item.meta && (
        <span className="font-mono text-xs uppercase tracking-widest tabular-nums text-faint md:col-span-3">
          {item.meta}
        </span>
      )}
      <span
        className={`font-display text-lg font-medium text-ink group-hover:text-accent ${
          item.meta ? "md:col-span-4" : "md:col-span-4 md:col-start-1"
        }`}
      >
        {item.title}
      </span>
      {item.blurb && (
        <p className="leading-relaxed text-muted md:col-span-5">{item.blurb}</p>
      )}
    </div>
  );
}

export function CollectionSection({
  id,
  heading = "",
  items,
  index = 1,
  total = 1,
  code = "INDEX",
}: {
  id?: string;
  heading?: string;
  items?: CollectionItem[];
  index?: number;
  total?: number;
  code?: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section id={id} className="mx-auto w-full max-w-[1800px] px-6 py-20 sm:px-10 md:py-24">
      <SectionHeader index={index} total={total} code={code} title={heading} />
      <ul className="mt-8">
        {items.map((item, i) => (
          <Reveal
            as="li"
            key={`${item.title}-${i}`}
            delay={i * 60}
            className="border-t border-line transition-colors hover:border-accent/40"
          >
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <ItemContent item={item} />
              </a>
            ) : (
              <div className="group">
                <ItemContent item={item} />
              </div>
            )}
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
