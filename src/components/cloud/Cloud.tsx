import { Canvas, Group, Line, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { CloudMood, Slot } from '@/game/types';

import {
  ART_H, ART_W, BEHIND_BODY, BODY_COLOR, CLOUD_BASE, CLOUD_BODY, CLOUD_SHADE, DECOR, FACES, MOOD_SCALE, sparkle,
  type Shape,
} from './art';

interface Props {
  mood: CloudMood;
  /** Equipped asset keys by slot (backgrounds are ignored here). */
  equipped?: Partial<Record<Slot, string>>;
  width: number;
  /** Change this number to play the feeding squish. */
  feedKey?: number;
  /** Turns off the idle animation (for small thumbnails). */
  still?: boolean;
}

const BOB: Record<CloudMood, { amp: number; ms: number }> = {
  radiant: { amp: 8, ms: 1600 },
  content: { amp: 8, ms: 2200 },
  drifting: { amp: 5, ms: 3250 },
  gloomy: { amp: 5, ms: 4000 },
  stormy: { amp: 5, ms: 5000 },
};
const ORIGIN = vec(122, 126);

const pathCache = new Map<string, ReturnType<typeof Skia.Path.MakeFromSVGString>>();
function toPath(d: string) {
  if (!pathCache.has(d)) pathCache.set(d, Skia.Path.MakeFromSVGString(d));
  return pathCache.get(d)!;
}

function Shapes({ shapes }: { shapes: Shape[] }) {
  return shapes.map((s, i) => {
    const path = toPath(s.d);
    if (!path) return null;
    return s.stroke ? (
      <Path key={i} path={path} style="stroke" color={s.stroke} strokeWidth={s.strokeWidth ?? 3} strokeCap="round" strokeJoin="round" opacity={s.opacity ?? 1} />
    ) : (
      <Path key={i} path={path} color={s.fill ?? '#000'} opacity={s.opacity ?? 1} />
    );
  });
}

function Drop({ x, phase, progress, color }: { x: number; phase: number; progress: SharedValue<number>; color: string }) {
  const t = useDerivedValue(() => (progress.value + phase) % 1);
  const transform = useDerivedValue(() => [{ translateY: t.value * 40 - 6 }]);
  const opacity = useDerivedValue(() => (t.value < 0.2 ? t.value * 5 : 1 - t.value));
  return (
    <Group transform={transform} opacity={opacity}>
      <Line p1={vec(x, 170)} p2={vec(x - 3, 182)} color={color} strokeWidth={3} strokeCap="round" />
    </Group>
  );
}

function Sparkle({ x, y, s, phase, progress }: { x: number; y: number; s: number; phase: number; progress: SharedValue<number> }) {
  const opacity = useDerivedValue(() => Math.sin(((progress.value + phase) % 1) * Math.PI));
  return <Path path={toPath(sparkle(x, y, s))!} color="#fff6c9" opacity={opacity} />;
}

function CloudImpl({ mood, equipped = {}, width, feedKey = 0, still = false }: Props) {
  const reduceMotion = useReducedMotion();
  const animate = !still && !reduceMotion;
  const bob = useSharedValue(0);
  const breathe = useSharedValue(0);
  const loop = useSharedValue(0);
  const munch = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      bob.value = 0.5;
      return;
    }
    const { ms } = BOB[mood];
    bob.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true);
    breathe.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true);
    loop.value = withRepeat(withTiming(1, { duration: mood === 'stormy' ? 800 : 1400, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(bob);
      cancelAnimation(breathe);
      cancelAnimation(loop);
    };
  }, [animate, mood, bob, breathe, loop]);

  useEffect(() => {
    if (!feedKey || !animate) return;
    munch.value = withSequence(
      ...[0, 1, 2].flatMap(() => [withTiming(1, { duration: 180 }), withTiming(-0.6, { duration: 150 }), withTiming(0, { duration: 170 })]),
    );
  }, [feedKey, animate, munch]);

  const amp = BOB[mood].amp;
  const scale = MOOD_SCALE[mood];
  const bodyTransform = useDerivedValue(() => {
    const m = munch.value;
    return [
      { translateY: -amp * bob.value },
      { scaleX: scale * (1 + 0.025 * breathe.value + 0.08 * m) },
      { scaleY: scale * (1 - 0.015 * breathe.value - 0.08 * m) },
    ];
  });

  const k = width / ART_W;
  const height = ART_H * k;
  const bodyColor = BODY_COLOR[mood];
  const decor = (slot: Slot) => (equipped[slot] ? DECOR[equipped[slot]!] ?? [] : []);
  const behind = (['accessory'] as const).filter((s) => equipped[s] && BEHIND_BODY.has(equipped[s]!));
  const front = (['face', 'accessory', 'hat'] as const).filter((s) => !behind.includes(s as 'accessory'));

  const drops = useMemo(
    () => (mood === 'gloomy' ? [80, 112, 146, 174] : mood === 'stormy' ? [70, 88, 104, 120, 136, 152, 168, 184] : []),
    [mood],
  );

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group transform={[{ scale: k }]}>
        {drops.map((x, i) => (
          <Drop key={x} x={x} phase={(i * 0.37) % 1} progress={loop} color={mood === 'stormy' ? '#6f95c6' : '#8fb7e8'} />
        ))}
        <Group transform={bodyTransform} origin={ORIGIN}>
          {behind.map((s) => <Shapes key={s} shapes={decor(s)} />)}
          {CLOUD_BODY.map((d) => <Path key={d} path={toPath(d)!} color={bodyColor} />)}
          <RoundedRect {...CLOUD_BASE} color={bodyColor} />
          <Path path={toPath(CLOUD_SHADE)!} color="#7f93b8" opacity={0.12} />
          <Shapes shapes={FACES[mood]} />
          {front.map((s) => <Shapes key={s} shapes={decor(s)} />)}
        </Group>
        {mood === 'radiant' &&
          [[40, 60, 1], [200, 40, 0.8], [214, 130, 0.7], [30, 140, 0.6]].map(([x, y, s], i) => (
            <Sparkle key={i} x={x!} y={y!} s={s!} phase={i * 0.25} progress={loop} />
          ))}
      </Group>
    </Canvas>
  );
}

export const Cloud = memo(CloudImpl);
