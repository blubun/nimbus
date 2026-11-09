import { describe, expect, it } from '@jest/globals';

import {
  DAY_MS,
  HOUR_MS,
  RULES,
  applyDecay,
  canBuy,
  countWords,
  currentStreak,
  dayKey,
  feed,
  moodFor,
  newPet,
  pointsFor,
  updateStreak,
  type EntryForRules,
  type FeedResult,
  type GameState,
  type Item,
  type PetState,
} from '..';

// Tests run with TZ=UTC (see package.json), so local days are UTC days.
const MON_9AM = Date.UTC(2026, 10, 9, 9, 0);
const words = (n: number) => ({ wordCount: n });

function fedOrThrow(r: FeedResult) {
  if (!r.fed) throw new Error(`expected a feeding, got ${r.reason}`);
  return r;
}

/** Saves entries one after another, the way the store does. */
function play(start: PetState, saves: { at: number; wordCount: number }[]) {
  let state: GameState = { pet: start, entries: [] };
  const results: FeedResult[] = [];
  for (const s of saves) {
    const r = feed(state, words(s.wordCount), s.at);
    const entry: EntryForRules = { createdAt: s.at, fed: r.fed, longBonus: r.fed && r.longBonus };
    state = { pet: r.pet, entries: [...state.entries, entry] };
    results.push(r);
  }
  return { state, results };
}

describe('applyDecay', () => {
  const pet = newPet('Nimbus', MON_9AM);

  it('changes nothing when no time has passed (0 days away)', () => {
    expect(applyDecay(pet, MON_9AM).fullness).toBe(70);
  });

  it('loses about 24 fullness after 1 day away', () => {
    const later = applyDecay(pet, MON_9AM + DAY_MS);
    expect(later.fullness).toBe(46);
    expect(later.lastUpdated).toBe(MON_9AM + DAY_MS);
  });

  it('bottoms out at 0 after 5 days away and never goes negative', () => {
    expect(applyDecay(pet, MON_9AM + 5 * DAY_MS).fullness).toBe(0);
  });

  it('is the same whether the app opens once or many times', () => {
    let stepped = pet;
    for (let h = 1; h <= 30; h++) stepped = applyDecay(stepped, MON_9AM + h * HOUR_MS);
    expect(stepped.fullness).toBeCloseTo(applyDecay(pet, MON_9AM + 30 * HOUR_MS).fullness);
  });

  it('ignores a clock that moved backwards', () => {
    expect(applyDecay(pet, MON_9AM - HOUR_MS)).toBe(pet);
  });

  it('empties a full cloud in about 4 days', () => {
    const full = { ...pet, fullness: 100 };
    expect(applyDecay(full, MON_9AM + 4 * DAY_MS).fullness).toBe(4);
    expect(applyDecay(full, MON_9AM + 100 * HOUR_MS).fullness).toBe(0);
  });
});

describe('moodFor', () => {
  it.each([
    [100, 'radiant'], [80, 'radiant'], [79, 'content'], [50, 'content'], [49, 'drifting'],
    [25, 'drifting'], [24, 'gloomy'], [1, 'gloomy'], [0.4, 'stormy'], [0, 'stormy'],
  ] as const)('%d -> %s', (f, mood) => {
    expect(moodFor(f)).toBe(mood);
  });
});

describe('feed', () => {
  const start = newPet('Nimbus', MON_9AM);

  it('needs at least 20 words', () => {
    const r = feed({ pet: start, entries: [] }, words(RULES.minWordsToFeed - 1), MON_9AM);
    expect(r).toMatchObject({ fed: false, reason: 'too-short' });
    expect(r.pet.points).toBe(0);
    expect(fedOrThrow(feed({ pet: start, entries: [] }, words(20), MON_9AM)).fed).toBe(true);
  });

  it('gives +40 for the first entry, +15 for the next two, then stops for the day', () => {
    const { results, state } = play({ ...start, fullness: 10 }, [
      { at: MON_9AM, wordCount: 30 },
      { at: MON_9AM + HOUR_MS, wordCount: 30 },
      { at: MON_9AM + 2 * HOUR_MS, wordCount: 30 },
      { at: MON_9AM + 3 * HOUR_MS, wordCount: 30 },
    ]);
    expect(results.map((r) => (r.fed ? r.fullnessGained : r.reason))).toEqual([40, 15, 15, 'daily-cap']);
    // 10 + 40 + 15 + 15, minus 3 hours of decay
    expect(state.pet.fullness).toBeCloseTo(77);
  });

  it('caps fullness at 100', () => {
    const r = fedOrThrow(feed({ pet: { ...start, fullness: 90 }, entries: [] }, words(25), MON_9AM));
    expect(r.pet.fullness).toBe(100);
    expect(r.fullnessGained).toBe(10);
  });

  it('brings a stormy cloud back with one entry', () => {
    const away = MON_9AM + 5 * DAY_MS;
    const r = fedOrThrow(feed({ pet: start, entries: [] }, words(25), away));
    expect(moodFor(r.pet.fullness)).toBe('drifting');
    expect(r.pet.fullness).toBe(40);
  });

  it('resets the daily cap on a new day', () => {
    const day1 = [0, 1, 2].map((h) => ({ at: MON_9AM + h * HOUR_MS, wordCount: 25 }));
    const { results } = play({ ...start, fullness: 0 }, [...day1, { at: MON_9AM + DAY_MS, wordCount: 25 }]);
    const last = fedOrThrow(results[3]!);
    expect(last.fullnessGained).toBe(40);
  });
});

describe('points', () => {
  const start = newPet('Nimbus', MON_9AM);

  it('earns at most 16 base points a day (10 + 3 + 3)', () => {
    const { results, state } = play(start, [0, 1, 2, 3].map((h) => ({ at: MON_9AM + h * HOUR_MS, wordCount: 25 })));
    const base = results.map((r) => (r.fed ? r.lines[0]!.points : 0));
    expect(base).toEqual([10, 3, 3, 0]);
    expect(state.pet.points).toBe(16 + 2); // plus a 1-day streak bonus
  });

  it('adds +5 for an entry over 150 words, once per day', () => {
    const { results } = play(start, [
      { at: MON_9AM, wordCount: 151 },
      { at: MON_9AM + HOUR_MS, wordCount: 200 },
      { at: MON_9AM + DAY_MS, wordCount: 151 },
    ]);
    expect(results.map((r) => r.fed && r.longBonus)).toEqual([true, false, true]);
  });

  it('does not count exactly 150 words as long', () => {
    expect(pointsFor(words(150), { isFirstToday: true, longBonusUsedToday: false, streak: 1 }).longBonus).toBe(false);
  });

  it('adds the streak bonus only on the first entry of the day, capped at +14', () => {
    expect(pointsFor(words(25), { isFirstToday: true, longBonusUsedToday: false, streak: 3 }).points).toBe(10 + 6);
    expect(pointsFor(words(25), { isFirstToday: true, longBonusUsedToday: false, streak: 7 }).points).toBe(10 + 14);
    expect(pointsFor(words(25), { isFirstToday: true, longBonusUsedToday: false, streak: 30 }).points).toBe(10 + 14);
    expect(pointsFor(words(25), { isFirstToday: false, longBonusUsedToday: false, streak: 30 }).points).toBe(3);
  });

  it('does not award points for entries that do not feed', () => {
    const { state } = play(start, [{ at: MON_9AM, wordCount: 5 }]);
    expect(state.pet.points).toBe(0);
  });
});

describe('streaks', () => {
  const start = newPet('Nimbus', MON_9AM);

  it('grows by one per consecutive day and holds within a day', () => {
    const { results } = play(start, [
      { at: MON_9AM, wordCount: 25 },
      { at: MON_9AM + 2 * HOUR_MS, wordCount: 25 },
      { at: MON_9AM + DAY_MS, wordCount: 25 },
      { at: MON_9AM + 2 * DAY_MS, wordCount: 25 },
    ]);
    expect(results.map((r) => r.pet.streak)).toEqual([1, 1, 2, 3]);
  });

  it('resets after a missed day but keeps points already earned', () => {
    const { state } = play(start, [
      { at: MON_9AM, wordCount: 25 },
      { at: MON_9AM + DAY_MS, wordCount: 25 },
    ]);
    const before = state.pet.points;
    const r = fedOrThrow(feed(state, words(25), MON_9AM + 3 * DAY_MS));
    expect(r.pet.streak).toBe(1);
    expect(r.pet.points).toBe(before + 10 + 2);
  });

  it('shows 0 in the UI once a day is missed, without changing the stored value', () => {
    const pet: PetState = { ...start, streak: 4, lastEntryDate: dayKey(MON_9AM) };
    expect(currentStreak(pet, MON_9AM + DAY_MS)).toBe(4);
    expect(currentStreak(pet, MON_9AM + 2 * DAY_MS)).toBe(0);
    expect(updateStreak(pet, MON_9AM + 2 * DAY_MS)).toBe(1);
  });

  it('counts calendar days, not 24-hour windows', () => {
    const lateNight = Date.UTC(2026, 10, 9, 23, 30);
    const nextMorning = Date.UTC(2026, 10, 10, 0, 30);
    const pet: PetState = { ...start, streak: 1, lastEntryDate: dayKey(lateNight) };
    expect(updateStreak(pet, nextMorning)).toBe(2);
  });

  it('includes the stored 7+ day cap in a full run', () => {
    const saves = Array.from({ length: 9 }, (_, d) => ({ at: MON_9AM + d * DAY_MS, wordCount: 25 }));
    const { results } = play(start, saves);
    const bonuses = results.map((r) => (r.fed ? r.lines.at(-1)!.points : 0));
    expect(bonuses).toEqual([2, 4, 6, 8, 10, 12, 14, 14, 14]);
  });
});

describe('canBuy', () => {
  const hat: Item = { id: 'sunhat', name: 'Sun Hat', slot: 'hat', price: 30, assetKey: 'sunhat' };
  const pet = { ...newPet('Nimbus', MON_9AM), points: 30 };

  it('needs enough points and not already owning it', () => {
    expect(canBuy(pet, hat, new Set())).toBe(true);
    expect(canBuy({ ...pet, points: 29 }, hat, new Set())).toBe(false);
    expect(canBuy(pet, hat, new Set(['sunhat']))).toBe(false);
  });

  it('lets a new player afford the sun hat within 3 days', () => {
    const saves = [0, 1, 2].map((d) => ({ at: MON_9AM + d * DAY_MS, wordCount: 25 }));
    const { state } = play(newPet('Nimbus', MON_9AM), saves);
    expect(state.pet.points).toBeGreaterThanOrEqual(hat.price);
  });
});

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords(' one  two\nthree\tfour ')).toBe(4);
  });
});
