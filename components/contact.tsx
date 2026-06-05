import { profile } from "@/content/portfolio";
import { SectionHeader } from "./section-header";
import { Reveal } from "./reveal";

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 rounded-[6px] border border-line px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-ink"
    >
      {label}
      <span
        aria-hidden
        className="text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
      >
        &#8599;
      </span>
    </a>
  );
}

export function Contact({
  id = "contact",
  heading = "Contact",
  index = 1,
  total = 1,
  code = "CONTACT",
}: {
  id?: string;
  heading?: string;
  index?: number;
  total?: number;
  code?: string;
}) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[1800px] border-t border-line px-6 py-24 sm:px-10 md:py-32"
    >
      <SectionHeader index={index} total={total} code={code} title={heading} />

      <Reveal delay={60}>
        <p className="mt-10 max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
          Let&apos;s build something.
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="mt-5 block w-fit max-w-full font-display text-2xl font-medium tracking-tight text-accent underline decoration-1 underline-offset-[6px] [overflow-wrap:anywhere] transition-opacity hover:opacity-80 sm:text-3xl md:text-5xl"
        >
          {profile.email}
        </a>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-12 flex flex-wrap gap-3">
          {profile.socials
            .filter((s) => !s.href.startsWith("REPLACE"))
            .map((social) => (
              <LinkChip
                key={social.href}
                href={social.href}
                label={social.label}
              />
            ))}
          <LinkChip href={profile.resumeUrl} label="Resume" />
        </div>
      </Reveal>
    </section>
  );
}
