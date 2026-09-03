/** Single source of truth for identity, meta tags and structured data. */
export const site = {
  name: "Artur Adams",
  role: "Full-Stack Software Developer",
  domain: "www.artur.ninja",
  url: "https://www.artur.ninja",
  email: "adamsartur@gmail.com",
  location: "São Paulo",
  availability: "Q4 2026",
  title: "Artur Adams — Move unseen. Land precisely.",
  description:
    "Artur Adams — full-stack software developer. Products built end to end, from database to last pixel, and handed over quiet enough to forget about. São Paulo, working worldwide.",
  social: {
    github: "https://github.com/arturadams",
    linkedin: "https://linkedin.com/in/arturadams",
  },
} as const;

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export const nav: readonly NavLink[] = [
  { label: "Work", href: "#work" },
  { label: "Kit", href: "#kit" },
  { label: "Way", href: "#way" },
] as const;
