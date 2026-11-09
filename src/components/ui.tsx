import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Pressable, StyleSheet, Text, View, type PressableProps, type TextProps, type ViewStyle } from 'react-native';

import type { EntryMood } from '@/game/types';
import { FONTS, type Scene } from '@/theme/scene';

/* ---------- text ---------- */

export function Heading({ level = 1, color, style, ...rest }: TextProps & { level?: 1 | 2 | 3; color: string }) {
  const size = level === 1 ? 40 : level === 2 ? 32 : 26;
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontFamily: FONTS.heading, fontSize: size, lineHeight: size * 1.05, color, includeFontPadding: false }, style]}
      {...rest}
    />
  );
}

/* ---------- buttons ---------- */

export function FeedButton({ label, scene, style, ...rest }: PressableProps & { label: string; scene: Scene; style?: ViewStyle }) {
  const c = scene.colors;
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.feed,
        { backgroundColor: c.accent, shadowColor: c.accentShadow, borderBottomColor: c.accentShadow },
        pressed && { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
        style,
      ]}
      {...rest}>
      <Icon name="pen" color={c.accentInk} size={22} />
      <Text style={[styles.feedText, { color: c.accentInk }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- icons (code-drawn, 24 x 24 grid) ---------- */

const ICON_PATHS = {
  cloud: 'M6.5 18h11a4.5 4.5 0 0 0 .6-9A6 6 0 0 0 6.6 10 4 4 0 0 0 6.5 18z',
  book: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h10 M9 8h5',
  bag: 'M5 8h14l-1 12H6z M9 10V7a3 3 0 0 1 6 0v3',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0',
  pen: 'M4 20l1-4L16 5l3 3L8 19z M14 7l3 3',
  // Entry moods: weather, never emoji.
  rough: 'M7 17h10a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 7 9.5 3.8 3.8 0 0 0 7 17z M12 17l-1.5 3h2.5l-1.5 3',
  low: 'M7 17h10a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 7 9.5 3.8 3.8 0 0 0 7 17z M9 19.5v2 M13 19.5v2 M16 19.5v1.5',
  okay: 'M6 18h11a4.5 4.5 0 0 0 .5-9A6 6 0 0 0 6 10a4 4 0 0 0 0 8z',
  good: 'M8.5 5a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M8.5 2.5v1 M3 8h1 M4.6 4.1l.7.7 M12.4 4.1l-.7.7 M9 20h8a3.5 3.5 0 0 0 .3-7 4.5 4.5 0 0 0-8.6 1A3 3 0 0 0 9 20z',
  great: 'M12 7.8a4.2 4.2 0 1 0 0 8.4a4.2 4.2 0 1 0 0-8.4z M12 2.5v2.2 M12 19.3v2.2 M2.5 12h2.2 M19.3 12h2.2 M5.3 5.3l1.5 1.5 M17.2 17.2l1.5 1.5 M5.3 18.7l1.5-1.5 M17.2 6.8l1.5-1.5',
} as const;
export type IconName = keyof typeof ICON_PATHS;
const iconCache = new Map<string, ReturnType<typeof Skia.Path.MakeFromSVGString>>();

export function Icon({ name, color, size = 24, strokeWidth = 1.8 }: { name: IconName; color: string; size?: number; strokeWidth?: number }) {
  if (!iconCache.has(name)) iconCache.set(name, Skia.Path.MakeFromSVGString(ICON_PATHS[name]));
  const path = iconCache.get(name);
  if (!path) return null;
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Path path={path} style="stroke" color={color} strokeWidth={strokeWidth} strokeCap="round" strokeJoin="round" transform={[{ scale: size / 24 }]} />
    </Canvas>
  );
}

export const ENTRY_MOODS: { key: EntryMood; label: string }[] = [
  { key: 'rough', label: 'Rough' },
  { key: 'low', label: 'Low' },
  { key: 'okay', label: 'Okay' },
  { key: 'good', label: 'Good' },
  { key: 'great', label: 'Great' },
];

/* ---------- small pieces ---------- */

const FLAME_OUTER = Skia.Path.MakeFromSVGString('M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-4.5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z');
const FLAME_INNER = Skia.Path.MakeFromSVGString('M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 2-3.5z');

export function Flame({ size = 26 }: { size?: number }) {
  if (!FLAME_OUTER || !FLAME_INNER) return null;
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Path path={FLAME_OUTER} color="#ff8f4d" transform={[{ scale: size / 24 }]} />
      <Path path={FLAME_INNER} color="#ffd36b" transform={[{ scale: size / 24 }]} />
    </Canvas>
  );
}

export function Coin({ size = 26 }: { size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f5b52a', borderBottomWidth: 2, borderBottomColor: '#d9951c' }} />;
}

export const styles = StyleSheet.create({
  feed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    paddingVertical: 10,
    borderBottomWidth: 5,
  },
  feedText: { fontFamily: FONTS.button, fontSize: 38, lineHeight: 40, includeFontPadding: false, marginTop: 4 },
});
