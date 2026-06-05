import Link from "next/link";
import type { Project } from "@/content/portfolio";

function MetaLink({
  href,
  label,
  accent = false,
}: {
  href: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`font-mono text-xs uppercase tracking-widest transition-colors ${
        accent ? "text-accent hover:opacity-80" : "text-muted hover:text-ink"
      }`}
    >
      {label} <span aria-hidden>&#8599;</span>
    </a>
  );
}

export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const num = String(index + 1).padStart(2, "0");

  return (
    <article className="group relative grid gap-6 border-t border-line py-12 transition-colors duration-200 hover:border-accent/50 md:grid-cols-12 md:gap-8">
      {/* Ghost index - large, faint, decorative. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-6 select-none font-display text-[4.5rem] font-bold leading-none tracking-tighter text-line/50 transition-colors duration-300 group-hover:text-accent/10 sm:text-[6rem] md:text-[9rem]"
      >
        {num}
      </span>

      <div className="relative md:col-span-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
          <span className="text-accent transition-colors">PROJ</span>{" "}
          <span className="tabular-nums">{`// ${num}`}</span>
        </p>
        <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent md:text-4xl">
          {project.title}
        </h3>
        {project.year && (
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted tabular-nums">
            {project.year}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {project.liveUrl && <MetaLink href={project.liveUrl} label="Live" />}
          {project.repoUrl && <MetaLink href={project.repoUrl} label="Code" />}
          {project.caseStudy && (
            <Link
              href={`/work/${project.slug}`}
              className="font-mono text-xs uppercase tracking-widest text-accent transition-opacity hover:opacity-80"
            >
              Case study <span aria-hidden>&#8594;</span>
            </Link>
          )}
        </div>
      </div>

      <div className="relative md:col-span-8">
        <p className="max-w-2xl text-xl leading-relaxed text-ink md:text-2xl">
          {project.blurb}
        </p>
        {project.what && (
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            {project.what}
          </p>
        )}
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded-[5px] border border-line px-2.5 py-1 font-mono text-xs text-muted transition-colors group-hover:border-line"
            >
              {tech}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
