import { projects } from "@/content/portfolio";
import { ProjectCard } from "./project-card";
import { SectionHeader } from "./section-header";
import { Reveal } from "./reveal";

export function FeaturedWork({
  id = "work",
  heading = "Selected work",
  index = 1,
  total = 1,
  code = "WORK",
}: {
  id?: string;
  heading?: string;
  index?: number;
  total?: number;
  code?: string;
}) {
  const featured = projects.filter((p) => p.featured);
  if (featured.length === 0) return null;

  return (
    <section id={id} className="mx-auto w-full max-w-[1800px] px-6 py-20 sm:px-10 md:py-28">
      <SectionHeader
        index={index}
        total={total}
        code={code}
        title={heading}
        note={`${String(featured.length).padStart(2, "0")} projects`}
      />
      <div className="mt-10">
        {featured.map((project, i) => (
          <Reveal key={project.slug} delay={i * 70}>
            <ProjectCard project={project} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
