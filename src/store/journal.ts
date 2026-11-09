import { create } from 'zustand';

import * as db from '@/db/database';
import type { EntryRow, InventoryRow, Settings } from '@/db/database';
import { ITEMS, applyDecay, canBuy, countWords, feed, itemById, newPet } from '@/game';
import type { EntryMood, FeedResult, PetState, Slot } from '@/game';
import { cancelDailyReminder, scheduleDailyReminder } from '@/notifications/reminder';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const slotIds = (slot: Slot) => ITEMS.filter((i) => i.slot === slot).map((i) => i.id);

interface JournalState {
  ready: boolean;
  pet: PetState | null;
  entries: EntryRow[]; // newest first
  inventory: InventoryRow[];
  settings: Settings;
  /** What the last saved entry earned; the Cloud screen shows it once, then clears it. */
  lastResult: FeedResult | null;
  /** Goes up by one each time an entry feeds the cloud; the Cloud screen plays the squish when it changes. */
  feedCount: number;

  init: () => Promise<void>;
  /** Applies decay since last_updated. Call on launch and whenever the app comes to the foreground. */
  refresh: () => Promise<void>;
  createPet: (name: string) => Promise<void>;
  addEntry: (text: string, mood: EntryMood | null) => Promise<FeedResult>;
  editEntry: (id: string, text: string, mood: EntryMood | null) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  buy: (itemId: string) => Promise<boolean>;
  setEquipped: (itemId: string, equipped: boolean) => Promise<void>;
  setReminder: (on: boolean, hour?: number, minute?: number) => Promise<boolean>;
  clearLastResult: () => void;
}

export const useJournal = create<JournalState>()((set, get) => ({
  ready: false,
  pet: null,
  entries: [],
  inventory: [],
  settings: db.DEFAULT_SETTINGS,
  lastResult: null,
  feedCount: 0,

  init: async () => {
    const [pet, entries, inventory, settings] = await Promise.all([
      db.loadPet(), db.loadEntries(), db.loadInventory(), db.loadSettings(),
    ]);
    set({ pet, entries, inventory, settings, ready: true });
    await get().refresh();
  },

  refresh: async () => {
    const { pet } = get();
    if (!pet) return;
    const next = applyDecay(pet, Date.now());
    if (next === pet) return;
    set({ pet: next });
    await db.savePet(next);
  },

  createPet: async (name) => {
    const pet = newPet(name.trim() || 'Nimbus', Date.now());
    await db.savePet(pet);
    set({ pet });
  },

  addEntry: async (text, mood) => {
    const { pet, entries } = get();
    if (!pet) throw new Error('No cloud yet');
    const now = Date.now();
    const wordCount = countWords(text);
    const result = feed({ pet, entries }, { wordCount }, now);
    const entry: EntryRow = {
      id: newId(), createdAt: now, updatedAt: now, text, wordCount, mood,
      fed: result.fed,
      earnedPoints: result.fed ? result.points : 0,
      earnedFullness: result.fed ? result.fullnessGained : 0,
      longBonus: result.fed && result.longBonus,
    };
    await db.insertEntryWithPet(entry, result.pet);
    set((s) => ({ pet: result.pet, entries: [entry, ...entries], lastResult: result, feedCount: s.feedCount + (result.fed ? 1 : 0) }));
    return result;
  },

  // Editing never re-feeds the cloud (spec open question, current answer: no).
  editEntry: async (id, text, mood) => {
    const now = Date.now();
    const wordCount = countWords(text);
    await db.updateEntry(id, text, wordCount, mood, now);
    set({ entries: get().entries.map((e) => (e.id === id ? { ...e, text, wordCount, mood, updatedAt: now } : e)) });
  },

  // Deleting keeps the points and fullness the entry earned.
  deleteEntry: async (id) => {
    await db.deleteEntry(id);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },

  buy: async (itemId) => {
    const { inventory } = get();
    const item = itemById(itemId);
    const pet = get().pet && applyDecay(get().pet!, Date.now());
    if (!item || !pet || !canBuy(pet, item, new Set(inventory.map((i) => i.itemId)))) return false;
    const next = { ...pet, points: pet.points - item.price };
    const now = Date.now();
    const same = slotIds(item.slot);
    await db.purchaseItem(itemId, same, next, now);
    set({
      pet: next,
      inventory: [
        ...inventory.map((i) => (same.includes(i.itemId) ? { ...i, equipped: false } : i)),
        { itemId, purchasedAt: now, equipped: true },
      ],
    });
    return true;
  },

  setEquipped: async (itemId, equipped) => {
    const item = itemById(itemId);
    if (!item) return;
    const same = slotIds(item.slot);
    await db.setEquipped(itemId, equipped, same);
    set({
      inventory: get().inventory.map((i) =>
        i.itemId === itemId ? { ...i, equipped } : equipped && same.includes(i.itemId) ? { ...i, equipped: false } : i,
      ),
    });
  },

  setReminder: async (on, hour, minute) => {
    const prev = get().settings;
    const h = hour ?? prev.reminderHour;
    const m = minute ?? prev.reminderMinute;
    let id: string | null = null;
    if (on) {
      id = await scheduleDailyReminder(h, m, get().pet?.name ?? 'Your cloud');
      if (!id) return false; // permission declined
    } else {
      await cancelDailyReminder();
    }
    const settings: Settings = { reminderOn: on, reminderHour: h, reminderMinute: m, reminderNotificationId: id };
    await db.saveSettings(settings);
    set({ settings });
    return true;
  },

  clearLastResult: () => set({ lastResult: null }),
}));

/** Equipped item asset keys by slot. */
export function selectEquipped(inventory: InventoryRow[]): Partial<Record<Slot, string>> {
  const out: Partial<Record<Slot, string>> = {};
  for (const row of inventory) {
    if (!row.equipped) continue;
    const item = itemById(row.itemId);
    if (item) out[item.slot] = item.assetKey;
  }
  return out;
}
