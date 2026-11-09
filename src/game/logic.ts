import { DAY_MS, HOUR_MS, RULES } from './rules';
import type { CloudMood, EntryForRules, FeedResult, GameState, Item, PetState, PointsLine } from './types';

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(time: number): string {
  const d = new Date(time);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function countWords(text: string): number {
  return text.trim().match(/\S+/g)?.length ?? 0;
}

export function newPet(name: string, now: number): PetState {
  return { name, fullness: RULES.startFullness, lastUpdated: now, points: 0, streak: 0, lastEntryDate: null };
}

/** Fullness lost since `lastUpdated`, computed on app open. No background timers. Never below 0. */
export function applyDecay(pet: PetState, now: number): PetState {
  const hours = (now - pet.lastUpdated) / HOUR_MS;
  if (hours <= 0) return pet;
  return { ...pet, fullness: Math.max(0, pet.fullness - hours * RULES.decayPerHour), lastUpdated: now };
}

export function moodFor(fullness: number): CloudMood {
  const f = Math.round(fullness);
  if (f >= 80) return 'radiant';
  if (f >= 50) return 'content';
  if (f >= 25) return 'drifting';
  if (f >= 1) return 'gloomy';
  return 'stormy';
}

/** Streak value after feeding at `now`: same day keeps it, the next day adds one, a gap restarts at 1. */
export function updateStreak(pet: PetState, now: number): number {
  if (pet.lastEntryDate === dayKey(now)) return pet.streak;
  if (pet.lastEntryDate === dayKey(now - DAY_MS)) return pet.streak + 1;
  return 1;
}

/** Streak to show in the UI: 0 once a whole day has been missed. Nothing earned is taken away. */
export function currentStreak(pet: PetState, now: number): number {
  const last = pet.lastEntryDate;
  return last === dayKey(now) || last === dayKey(now - DAY_MS) ? pet.streak : 0;
}

export function feedsToday(entries: readonly EntryForRules[], now: number): EntryForRules[] {
  const today = dayKey(now);
  return entries.filter((e) => e.fed && dayKey(e.createdAt) === today);
}

/** Points for one feeding entry. `streak` is the streak including today. */
export function pointsFor(
  entry: { wordCount: number },
  state: { isFirstToday: boolean; longBonusUsedToday: boolean; streak: number },
): { points: number; lines: PointsLine[]; longBonus: boolean } {
  const lines: PointsLine[] = [
    state.isFirstToday
      ? { label: 'First entry today', points: RULES.firstEntryPoints }
      : { label: 'Extra entry', points: RULES.extraEntryPoints },
  ];
  const longBonus = entry.wordCount > RULES.longEntryWords && !state.longBonusUsedToday;
  if (longBonus) lines.push({ label: 'Long entry bonus', points: RULES.longEntryBonus });
  if (state.isFirstToday) {
    lines.push({
      label: `${state.streak}-day streak`,
      points: Math.min(state.streak * RULES.streakBonusPerDay, RULES.streakBonusCap),
    });
  }
  return { points: lines.reduce((sum, l) => sum + l.points, 0), lines, longBonus };
}

/** Saving a new entry: decays first, then feeds if the entry counts. */
export function feed(state: GameState, entry: { wordCount: number }, now: number): FeedResult {
  const pet = applyDecay(state.pet, now);
  if (entry.wordCount < RULES.minWordsToFeed) return { fed: false, reason: 'too-short', pet };

  const today = feedsToday(state.entries, now);
  if (today.length >= RULES.maxFeedsPerDay) return { fed: false, reason: 'daily-cap', pet };

  const isFirstToday = today.length === 0;
  const streak = updateStreak(pet, now);
  const { points, lines, longBonus } = pointsFor(entry, {
    isFirstToday,
    longBonusUsedToday: today.some((e) => e.longBonus),
    streak,
  });
  const fullness = Math.min(
    RULES.maxFullness,
    pet.fullness + (isFirstToday ? RULES.firstFeedFullness : RULES.extraFeedFullness),
  );

  return {
    fed: true,
    fullnessGained: Math.round(fullness - pet.fullness),
    points,
    lines,
    longBonus,
    pet: { ...pet, fullness, points: pet.points + points, streak, lastEntryDate: dayKey(now) },
  };
}

export function canBuy(pet: PetState, item: Item, owned: ReadonlySet<string>): boolean {
  return !owned.has(item.id) && pet.points >= item.price;
}
