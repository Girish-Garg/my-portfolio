import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, profile } from "@/content/portfolio";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export function generateStaticParams() {
  return projects.filter((p) => p.caseStudy).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} - ${profile.name}`,
    description: project.blurb,
  };
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group font-mono text-sm uppercase tracking-widest text-muted transition-colors hover:text-ink"
    >
      {label}{" "}
      <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">
        &#8599;
      </span>
    </a>
  );
}

function BackLink() {
  return (
    <Link
      href="/#work"
      className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
    >
      <span aria-hidden className="inline-block transition-transform group-hover:-translate-x-0.5">
        &#8592;
      </span>
      Back to work
    </Link>
  );
}

const sectionDefs: { key: "what" | "why" | "how" | "result"; label: string }[] = [
  { key: "what", label: "What it is" },
  { key: "why", label: "Why I built it" },
  { key: "how", label: "How it works" },
  { key: "result", label: "Result" },
];

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug && p.caseStudy);
  if (!project) notFound();

  const present = sectionDefs.filter((s) => Boolean(project[s.key]));

  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Reveal>
          <BackLink />
        </Reveal>

        {/* Blueprint metadata strip. */}
        <Reveal delay={40}>
          <div className="mt-12 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-faint">
            <span className="text-accent">Case study</span>
            <span aria-hidden className="text-line">
              /
            </span>
            {project.year && (
              <>
                <time className="tabular-nums">{project.year}</time>
                <span aria-hidden className="text-line">
                  /
                </span>
              </>
            )}
            <span>{project.title}</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-7xl">
            {project.title}
          </h1>
        </Reveal>

        <Reveal delay={100}>
          <p className="mt-6 max-w-2xl text-balance text-xl leading-snug text-muted md:text-2xl">
            {project.blurb}
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {project.liveUrl && <ExternalLink href={project.liveUrl} label="Live" />}
            {project.repoUrl && <ExternalLink href={project.repoUrl} label="Code" />}
          </div>
        </Reveal>

        <Reveal delay={160}>
          <ul className="mt-8 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-[5px] border border-line px-2.5 py-1 font-mono text-xs text-muted"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-16 space-y-14">
          {present.map((section, i) => (
            <Reveal key={section.key} delay={i * 40}>
              <section className="grid gap-3 border-t border-line pt-8 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                  <span className="font-mono text-xs tabular-nums text-accent">
                    {i + 1}.0
                  </span>
                  <h2 className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                    {section.label}
                  </h2>
                </div>
                <p className="text-lg leading-relaxed text-ink md:col-span-9">
                  {project[section.key]}
                </p>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-20 border-t border-line pt-8">
            <BackLink />
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
