export interface Tenet {
  /** Decorative — rendered aria-hidden with lang="ja". */
  readonly kanji: string;
  readonly romaji: string;
  readonly gloss: string;
  readonly line: string;
}

export const tenets: readonly Tenet[] = [
  {
    kanji: "影",
    romaji: "Kage",
    gloss: "Shadow",
    line: "The best infrastructure is the kind nobody has to think about.",
  },
  {
    kanji: "刃",
    romaji: "Yaiba",
    gloss: "Blade",
    line: "One cut in the right place beats ten in the wrong ones.",
  },
  {
    kanji: "型",
    romaji: "Kata",
    gloss: "Form",
    line: "The same standard on line one and on line ten thousand.",
  },
] as const;
