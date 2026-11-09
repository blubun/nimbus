export type CloudMood = 'radiant' | 'content' | 'drifting' | 'gloomy' | 'stormy';
export type EntryMood = 'rough' | 'low' | 'okay' | 'good' | 'great';
export type Slot = 'hat' | 'face' | 'accessory' | 'background';

/** Mirrors the single row in `pet_state`. Timestamps are epoch milliseconds. */
export interface PetState {
  name: string;
  fullness: number;
  lastUpdated: number;
  points: number;
  streak: number;
  /** Local calendar day (YYYY-MM-DD) of the last entry that fed the cloud. */
  lastEntryDate: string | null;
}

/** The parts of a saved entry the rules need to know about. */
export interface EntryForRules {
  createdAt: number;
  fed: boolean;
  longBonus: boolean;
}

export interface GameState {
  pet: PetState;
  entries: readonly EntryForRules[];
}

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  assetKey: string;
}

export type PointsLine = { label: string; points: number };

export type FeedResult =
  | {
      fed: true;
      pet: PetState;
      fullnessGained: number;
      points: number;
      lines: PointsLine[];
      longBonus: boolean;
    }
  | { fed: false; reason: 'too-short' | 'daily-cap'; pet: PetState };
