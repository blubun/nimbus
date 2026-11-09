/** Starting numbers from the v1 spec. Tune these in playtesting. */
export const RULES = {
  startFullness: 70,
  maxFullness: 100,
  decayPerHour: 1,

  minWordsToFeed: 20,
  maxFeedsPerDay: 3,
  firstFeedFullness: 40,
  extraFeedFullness: 15,

  firstEntryPoints: 10,
  extraEntryPoints: 3,
  longEntryWords: 150,
  longEntryBonus: 5,
  streakBonusPerDay: 2,
  streakBonusCap: 14,
} as const;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
