# Cloud Journal

A daily journaling app where every entry feeds a virtual pet cloud. Writing keeps the cloud fluffy and happy and earns points to spend on decorations. All data stays on the device.

This is the v1 scaffold built from the spec (Nov 8, 2026) and the clickable web prototype.

## Run it

```bash
npm install
```

```bash
npx expo start
```

Then press `i` for the iOS simulator or `a` for Android. Skia, SQLite and notifications are native modules, so if something is missing from Expo Go, use a development build:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## Checks

```bash
npm test            # game-logic tests (Jest, run with TZ=UTC)
npm run typecheck   # tsc, strict mode
npx expo lint
```

## How it's organised

| Path | What's there |
| --- | --- |
| `src/game/` | The rules as pure TypeScript: `applyDecay`, `feed`, `pointsFor`, `moodFor`, `updateStreak`, `canBuy`. No React, no database. Numbers live in `rules.ts`; shop items are seeded from `items.json`. Tests are in `__tests__/`. |
| `src/db/database.ts` | expo-sqlite: migrations (tracked with `PRAGMA user_version`), and reads and writes for `entries`, `pet_state`, `items`, `inventory`, plus a small `settings` table for the reminder. |
| `src/store/journal.ts` | Zustand store. Calls the game rules, then writes to SQLite. Decay is applied on launch and whenever the app returns to the foreground; there are no background timers. |
| `src/theme/scene.ts` | The sky, tab bar and text colours. They follow the cloud's mood, or the equipped background if one is bought. |
| `src/components/cloud/` | The cloud, drawn with React Native Skia and animated with Reanimated. `art.ts` holds every shape as data, keyed by `asset_key`, so v2 art can replace it item by item. |
| `src/notifications/reminder.ts` | The one optional daily reminder (expo-notifications). |
| `src/app/` | Expo Router screens: `(tabs)/index` (Cloud), `(tabs)/history`, `(tabs)/shop`, `entry` (new or edit), `onboarding`. |

## Decisions carried over from the prototype

- Headings (h1 to h3) use **Modak**; the Feed button uses **Dongle**; body text uses Figtree, with Baloo 2 for numbers.
- The sky fills every screen, and the bottom tab bar is tinted to match it.
- On the entry screen the mood picker is five round weather icons (no emoji) in the bottom eighth of the screen, and the text area has no border.
- Editing an entry never re-feeds the cloud. Deleting an entry keeps what it earned.
- Reminders stay neutral and don't mention the cloud's mood.

## Before the first TestFlight build

- Replace `com.example.cloudjournal` in `app.json` with your real bundle identifier and Android package.
- Replace the placeholder icon and splash images in `assets/images/`.
- Run `npx eas-cli@latest init` to link an EAS project, then `npx eas-cli@latest build --profile production --platform ios`.
