import { bio, skills } from "@/content/portfolio";
import { SectionHeader } from "./section-header";
import { Reveal } from "./reveal";

export function About({
  id = "about",
  heading = "About",
  index = 1,
  total = 1,
  code = "ABOUT",
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
      className="mx-auto w-full max-w-[1800px] border-t border-line px-6 py-20 sm:px-10 md:py-28"
    >
      <SectionHeader index={index} total={total} code={code} title={heading} />

      <div className="mt-12 grid items-start gap-x-16 gap-y-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7 xl:col-span-6">
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink md:text-xl md:leading-relaxed">
            {bio}
          </p>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-5 lg:col-start-8 xl:col-span-5 xl:col-start-8">
          <dl className="grid grid-cols-2 gap-x-10 gap-y-10">
            {skills.map((group) => (
              <div key={group.group} className="border-t border-line pt-4">
                <dt className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  {group.group}
                  <span className="text-faint tabular-nums">
                    ({String(group.items.length).padStart(2, "0")})
                  </span>
                </dt>
                <dd className="mt-4 space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item} className="text-sm text-ink">
                      {item}
                    </div>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
