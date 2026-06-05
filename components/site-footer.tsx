import { profile } from "@/content/portfolio";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const place = profile.location?.split(",")[0]?.trim().toUpperCase();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-6 py-10 font-mono text-xs uppercase tracking-widest text-faint sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex items-center gap-3">
          <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
          <span className="text-muted tabular-nums">
            &copy; {year} {profile.name}
          </span>
          {place && (
            <>
              <span aria-hidden className="text-line">
                /
              </span>
              <span>{place}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-5">
          <span>Built with Next.js + Tailwind</span>
          <a
            href="#main"
            className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
          >
            <span
              aria-hidden
              className="transition-transform group-hover:-translate-y-0.5"
            >
              &#8593;
            </span>
            Top
          </a>
        </div>
      </div>
    </footer>
  );
}
