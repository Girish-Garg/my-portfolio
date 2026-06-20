import Link from "next/link";
import { profile, sections } from "@/content/portfolio";
import { ThemeToggle } from "./theme-toggle";

export function SiteNav() {
  const navItems = sections.filter((s) => s.navLabel && s.id);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base/70 backdrop-blur-md supports-[backdrop-filter]:bg-base/55">
      <nav className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-6 py-4 sm:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink"
        >
          <span
            aria-hidden
            className="size-2 rounded-[2px] bg-accent transition-transform duration-200 group-hover:rotate-45"
          />
          GRGS
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={`/#${item.id}`}
              className="hidden font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink sm:inline"
            >
              {item.navLabel}
            </Link>
          ))}
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[6px] border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-ink"
          >
            Resume
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* Reading-progress hairline. Animates only where scroll-timeline is
          supported; stays hidden (scaleX 0) everywhere else. */}
      <span
        aria-hidden
        className="scroll-progress absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-accent"
      />
    </header>
  );
}
