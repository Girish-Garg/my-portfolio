/**
 * The whole site reads from content/portfolio.json. Edit that file - never this
 * one - to change any text, add projects, add social links, reorder sections,
 * or add brand-new sections. This module just types the JSON and re-exports it.
 *
 * Adding things is always "add an entry to an array in the JSON":
 *   - a project        -> add to "projects"
 *   - a skill group    -> add to "skills"
 *   - a social link    -> add to "profile.socials"
 *   - a whole section  -> add to "sections" (use type "collection" for a
 *                         custom titled list; no code changes needed)
 */
import data from "./portfolio.json";

export type SocialLink = { label: string; href: string };

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  location?: string;
  email: string;
  resumeUrl: string;
  socials: SocialLink[];
};

export type Chat = {
  placeholder: string;
  suggestions: string[];
};

export type SkillGroup = { group: string; items: string[] };

export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  what: string;
  why: string;
  how: string;
  result: string;
  liveUrl?: string;
  repoUrl?: string;
  featured: boolean;
  caseStudy?: boolean;
  year?: string;
};

export type FaqItem = { q: string; a: string };

/** A row in a generic "collection" section (experience, writing, talks, etc.). */
export type CollectionItem = {
  title: string;
  meta?: string;
  blurb?: string;
  href?: string;
};

export type SectionType =
  | "featured-work"
  | "more-projects"
  | "about"
  | "contact"
  | "collection";

export type Section = {
  type: SectionType;
  id?: string;
  navLabel?: string;
  heading?: string;
  items?: CollectionItem[];
};

export type Portfolio = {
  profile: Profile;
  chat: Chat;
  bio: string;
  skills: SkillGroup[];
  projects: Project[];
  faq: FaqItem[];
  sections: Section[];
};

const portfolio = data as unknown as Portfolio;

export const profile = portfolio.profile;
export const chat = portfolio.chat;
export const bio = portfolio.bio;
export const skills = portfolio.skills;
export const projects = portfolio.projects;
export const faq = portfolio.faq;
export const sections = portfolio.sections;
