import { projects } from "@/content/portfolio";
import { SectionHeader } from "./section-header";
import { Reveal } from "./reveal";

export function MoreProjects({
  id = "more",
  heading = "More on GitHub",
  index = 1,
  total = 1,
  code = "MORE",
}: {
  id?: string;
  heading?: string;
  index?: number;
  total?: number;
  code?: string;
}) {
  const more = projects.filter((p) => !p.featured);
  if (more.length === 0) return null;

  return (
    <section id={id} className="mx-auto w-full max-w-[1800px] px-6 py-20 sm:px-10 md:py-24">
      <SectionHeader index={index} total={total} code={code} title={heading} />
      <ul className="mt-8">
        {more.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 50} className="border-t border-line">
            <a
              href={p.repoUrl ?? p.liveUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-5 py-5 transition-colors"
            >
              <span className="font-mono text-xs tabular-nums text-faint transition-colors group-hover:text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-lg font-medium text-ink transition-colors group-hover:text-accent">
                {p.title}
              </span>
              <span className="hidden flex-1 truncate font-mono text-xs text-faint sm:block">
                {p.blurb}
              </span>
              <span
                aria-hidden
                className="font-mono text-xs text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
              >
                &#8599;
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
