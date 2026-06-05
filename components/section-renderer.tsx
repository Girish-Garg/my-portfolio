import type { Section } from "@/content/portfolio";
import { FeaturedWork } from "./featured-work";
import { MoreProjects } from "./more-projects";
import { About } from "./about";
import { Contact } from "./contact";
import { CollectionSection } from "./collection-section";

export function SectionRenderer({
  section,
  index,
  total,
}: {
  section: Section;
  index: number;
  total: number;
}) {
  // Short uppercase code for the blueprint strip: navLabel, else the id.
  const code = (section.navLabel ?? section.id ?? section.type).toUpperCase();
  const shared = {
    id: section.id,
    heading: section.heading,
    index,
    total,
    code,
  };

  switch (section.type) {
    case "featured-work":
      return <FeaturedWork {...shared} />;
    case "more-projects":
      return <MoreProjects {...shared} />;
    case "about":
      return <About {...shared} />;
    case "contact":
      return <Contact {...shared} />;
    case "collection":
      return <CollectionSection {...shared} items={section.items} />;
    default:
      return null;
  }
}
