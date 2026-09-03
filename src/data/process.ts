export interface Step {
  /** Decorative — rendered aria-hidden with lang="ja". */
  readonly kanji: string;
  readonly title: string;
  readonly body: string;
}

export const process: readonly Step[] = [
  {
    kanji: "見",
    title: "Scout",
    body: "A short discovery sprint: the real constraint, the real user, the real deadline. You get a written plan with costs before any code exists.",
  },
  {
    kanji: "計",
    title: "Plan",
    body: "Schema, API contracts and infrastructure sketched together, so the parts are designed to fit instead of forced to.",
  },
  {
    kanji: "打",
    title: "Strike",
    body: "Weekly working software, not weekly slide decks. You click a staging URL every Friday, from week one.",
  },
  {
    kanji: "消",
    title: "Vanish",
    body: "Load tests, monitoring, and a handover your team can actually run with. Then I disappear — and stay reachable through the first month of weather.",
  },
] as const;
