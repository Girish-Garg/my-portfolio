import { profile } from "@/content/portfolio";
import { Terminal } from "./terminal/terminal";

export function Hero() {
  return (
    <section className="relative isolate flex flex-col overflow-hidden lg:min-h-[calc(100svh-3.75rem)]">
      {/* Atmosphere: a vivid cobalt aura over a faint drafting grid. */}
      <div aria-hidden className="aura pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="blueprint-grid pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col justify-center px-6 pb-16 pt-10 sm:px-10 md:pb-20 md:pt-14">
        {/* Metadata strip - the instrument header, full bleed. */}
        <div
          className="hero-rise flex flex-wrap items-center gap-x-4 gap-y-3 font-mono text-xs uppercase tracking-[0.18em]"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="text-muted">{profile.role}</span>
          {profile.location && (
            <>
              <span aria-hidden className="text-line">
                /
              </span>
              <span className="text-faint">{profile.location}</span>
            </>
          )}
        </div>

        {/* The name owns the page - full bleed, with a live cobalt cursor. */}
        <h1
          className="hero-rise mt-9 font-display font-bold leading-[0.86] tracking-[-0.04em] text-ink text-[clamp(2.75rem,12vw,10rem)]"
          style={{ animationDelay: "0.14s" }}
        >
          {profile.name}
        </h1>

        {/* Below the name: the pitch on the left, the live console on the right. */}
        <div className="mt-10 grid items-start gap-x-12 gap-y-10 md:mt-12 lg:grid-cols-12">
          <div
            className="hero-rise lg:col-span-6 xl:col-span-7"
            style={{ animationDelay: "0.26s" }}
          >
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted md:text-xl">
              {profile.tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#work"
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-display text-sm font-semibold text-accent-ink transition-[transform,opacity] duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
              >
                View work
                <span
                  aria-hidden
                  className="transition-transform duration-150 group-hover:translate-y-0.5"
                >
                  &#8595;
                </span>
              </a>
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-display text-sm font-semibold text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                Get in touch
                <span
                  aria-hidden
                  className="text-faint transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
                >
                  &#8594;
                </span>
              </a>
            </div>
          </div>

          {/* The chat, framed as a figure - the lit centerpiece. */}
          <div
            className="hero-rise lg:col-span-6 xl:col-span-5"
            style={{ animationDelay: "0.36s" }}
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-faint">
              Ask my portfolio
            </p>
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}
