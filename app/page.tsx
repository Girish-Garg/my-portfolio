import { sections } from "@/content/portfolio";
import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { SectionRenderer } from "@/components/section-renderer";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        {sections.map((section, i) => (
          <SectionRenderer
            key={section.id ?? `${section.type}-${i}`}
            section={section}
            index={i + 1}
            total={sections.length}
          />
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
