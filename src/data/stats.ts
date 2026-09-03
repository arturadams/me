export interface Stat {
  /** Counted up from zero when the stat scrolls into view. */
  readonly value: number;
  readonly decimals?: number;
  readonly suffix?: string;
  readonly label: string;
}

export const stats: readonly Stat[] = [
  { value: 8, suffix: "yrs", label: "In the field" },
  { value: 23, label: "Systems shipped end to end" },
  { value: 99.98, decimals: 2, suffix: "%", label: "Uptime across services I run" },
] as const;
