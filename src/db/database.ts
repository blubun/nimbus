import * as SQLite from 'expo-sqlite';

import { ITEMS } from '@/game/items';
import type { EntryMood, PetState } from '@/game/types';

export interface EntryRow {
  id: string;
  createdAt: number;
  updatedAt: number;
  text: string;
  wordCount: number;
  mood: EntryMood | null;
  fed: boolean;
  earnedPoints: number;
  earnedFullness: number;
  longBonus: boolean;
}

export interface InventoryRow {
  itemId: string;
  purchasedAt: number;
  equipped: boolean;
}

export interface Settings {
  reminderOn: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderNotificationId: string | null;
}

const DB_NAME = 'cloud-journal.db';

/**
 * Migrations run in order; `PRAGMA user_version` records how many have run.
 * Add new steps to the end, never edit an old one.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE entries (
    id TEXT PRIMARY KEY NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    mood TEXT,
    fed INTEGER NOT NULL DEFAULT 0,
    earned_points INTEGER NOT NULL DEFAULT 0,
    earned_fullness INTEGER NOT NULL DEFAULT 0,
    long_bonus INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX entries_created_at ON entries (created_at);

  CREATE TABLE pet_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    fullness REAL NOT NULL,
    last_updated INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_entry_date TEXT
  );

  CREATE TABLE items (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slot TEXT NOT NULL,
    price INTEGER NOT NULL,
    asset_key TEXT NOT NULL
  );

  CREATE TABLE inventory (
    item_id TEXT PRIMARY KEY NOT NULL REFERENCES items (id),
    purchased_at INTEGER NOT NULL,
    equipped INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= open();
  return dbPromise;
}

async function open() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[i]!);
      await txn.execAsync(`PRAGMA user_version = ${i + 1}`);
    });
  }
  await seedItems(db);
  return db;
}

/** Items come from items.json; re-seeding on every launch keeps names and prices in sync with the app. */
async function seedItems(db: SQLite.SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const item of ITEMS) {
      await db.runAsync(
        `INSERT INTO items (id, name, slot, price, asset_key) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, slot = excluded.slot,
           price = excluded.price, asset_key = excluded.asset_key`,
        item.id, item.name, item.slot, item.price, item.assetKey,
      );
    }
  });
}

/* ---------- pet ---------- */

type PetRow = { name: string; fullness: number; last_updated: number; points: number; streak: number; last_entry_date: string | null };

export async function loadPet(): Promise<PetState | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<PetRow>('SELECT * FROM pet_state WHERE id = 1');
  if (!r) return null;
  return { name: r.name, fullness: r.fullness, lastUpdated: r.last_updated, points: r.points, streak: r.streak, lastEntryDate: r.last_entry_date };
}

export async function savePet(p: PetState): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO pet_state (id, name, fullness, last_updated, points, streak, last_entry_date)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET name = excluded.name, fullness = excluded.fullness,
       last_updated = excluded.last_updated, points = excluded.points, streak = excluded.streak,
       last_entry_date = excluded.last_entry_date`,
    p.name, p.fullness, p.lastUpdated, p.points, p.streak, p.lastEntryDate,
  );
}

/* ---------- entries ---------- */

type DbEntry = {
  id: string; created_at: number; updated_at: number; text: string; word_count: number; mood: string | null;
  fed: number; earned_points: number; earned_fullness: number; long_bonus: number;
};

const toEntry = (r: DbEntry): EntryRow => ({
  id: r.id, createdAt: r.created_at, updatedAt: r.updated_at, text: r.text, wordCount: r.word_count,
  mood: r.mood as EntryMood | null, fed: r.fed === 1, earnedPoints: r.earned_points,
  earnedFullness: r.earned_fullness, longBonus: r.long_bonus === 1,
});

export async function loadEntries(): Promise<EntryRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DbEntry>('SELECT * FROM entries ORDER BY created_at DESC');
  return rows.map(toEntry);
}

/** Inserts a new entry and saves the pet in one transaction, so a crash can't feed without saving. */
export async function insertEntryWithPet(e: EntryRow, pet: PetState): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO entries (id, created_at, updated_at, text, word_count, mood, fed, earned_points, earned_fullness, long_bonus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      e.id, e.createdAt, e.updatedAt, e.text, e.wordCount, e.mood, e.fed ? 1 : 0,
      e.earnedPoints, e.earnedFullness, e.longBonus ? 1 : 0,
    );
    await txn.runAsync(
      `UPDATE pet_state SET fullness = ?, last_updated = ?, points = ?, streak = ?, last_entry_date = ? WHERE id = 1`,
      pet.fullness, pet.lastUpdated, pet.points, pet.streak, pet.lastEntryDate,
    );
  });
}

export async function updateEntry(id: string, text: string, wordCount: number, mood: EntryMood | null, now: number) {
  const db = await getDb();
  await db.runAsync('UPDATE entries SET text = ?, word_count = ?, mood = ?, updated_at = ? WHERE id = ?', text, wordCount, mood, now, id);
}

export async function deleteEntry(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
}

/* ---------- inventory ---------- */

export async function loadInventory(): Promise<InventoryRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ item_id: string; purchased_at: number; equipped: number }>('SELECT * FROM inventory');
  return rows.map((r) => ({ itemId: r.item_id, purchasedAt: r.purchased_at, equipped: r.equipped === 1 }));
}

/** Spends points, records the purchase, and equips it in place of anything else in the same slot. */
export async function purchaseItem(itemId: string, slotItemIds: string[], pet: PetState, now: number) {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`UPDATE inventory SET equipped = 0 WHERE item_id IN (${slotItemIds.map(() => '?').join(',')})`, ...slotItemIds);
    await txn.runAsync('INSERT INTO inventory (item_id, purchased_at, equipped) VALUES (?, ?, 1)', itemId, now);
    await txn.runAsync('UPDATE pet_state SET points = ?, fullness = ?, last_updated = ? WHERE id = 1', pet.points, pet.fullness, pet.lastUpdated);
  });
}

export async function setEquipped(itemId: string, equipped: boolean, slotItemIds: string[]) {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    if (equipped) {
      await txn.runAsync(`UPDATE inventory SET equipped = 0 WHERE item_id IN (${slotItemIds.map(() => '?').join(',')})`, ...slotItemIds);
    }
    await txn.runAsync('UPDATE inventory SET equipped = ? WHERE item_id = ?', equipped ? 1 : 0, itemId);
  });
}

/* ---------- settings ---------- */

export const DEFAULT_SETTINGS: Settings = { reminderOn: false, reminderHour: 20, reminderMinute: 0, reminderNotificationId: null };

export async function loadSettings(): Promise<Settings> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'app'");
  return r ? { ...DEFAULT_SETTINGS, ...(JSON.parse(r.value) as Partial<Settings>) } : DEFAULT_SETTINGS;
}

export async function saveSettings(s: Settings) {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES ('app', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    JSON.stringify(s),
  );
}
