export interface KitColumn {
  /** Decorative — rendered aria-hidden with lang="ja". */
  readonly kanji: string;
  readonly title: string;
  readonly role: string;
  readonly items: readonly string[];
}

export const kit: readonly KitColumn[] = [
  {
    kanji: "表",
    title: "The surface",
    role: "What people touch",
    items: [
      "TypeScript",
      "React & Next.js",
      "Astro & Svelte",
      "Tailwind, and CSS by hand",
      "WebGL & Canvas",
      "Accessibility as a spec, not a pass",
    ],
  },
  {
    kanji: "裏",
    title: "The weight",
    role: "What holds it up",
    items: [
      "Node.js & Go",
      "PostgreSQL & Redis",
      "ClickHouse",
      "REST, gRPC & GraphQL",
      "Event-driven queues",
      "Auth that survives an audit",
    ],
  },
  {
    kanji: "守",
    title: "The watch",
    role: "What keeps it standing",
    items: [
      "Docker & Kubernetes",
      "Terraform on AWS",
      "GitHub Actions",
      "Grafana & OpenTelemetry",
      "Load testing before launch day",
      "Docs written for the next dev",
    ],
  },
] as const;
