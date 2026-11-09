import type { CloudMood } from '@/game/types';

/**
 * Code-drawn art for v1. Everything is in a 240 x 210 box; the cloud's face is centred near (122, 120).
 * v2 can swap these for hand-drawn assets keyed by the same asset_key.
 */
export interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const ART_W = 240;
export const ART_H = 210;

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
const circle = (cx: number, cy: number, r: number) => ellipse(cx, cy, r, r);

const INK = '#2a3350';
const eye = (cx: number, cy: number, rx: number, ry: number): Shape => ({ d: ellipse(cx, cy, rx, ry), fill: INK });
const line = (d: string, strokeWidth = 3.2): Shape => ({ d, stroke: INK, strokeWidth });

export const CLOUD_BODY = [circle(78, 118, 40), circle(122, 90, 54), circle(168, 112, 42)];
export const CLOUD_BASE = { x: 44, y: 106, width: 160, height: 56, r: 28 };
export const CLOUD_SHADE = 'M52 140 Q122 172 196 140 Q200 160 176 162 L72 162 Q48 160 52 140Z';

export const BODY_COLOR: Record<CloudMood, string> = {
  radiant: '#ffffff',
  content: '#f6f8fc',
  drifting: '#dde3eb',
  gloomy: '#b6bfcb',
  stormy: '#7b8597',
};

/** How big the cloud is drawn in each mood. */
export const MOOD_SCALE: Record<CloudMood, number> = { radiant: 1.06, content: 1, drifting: 0.9, gloomy: 0.87, stormy: 0.86 };

export const FACES: Record<CloudMood, Shape[]> = {
  radiant: [line('M99 121 q7 -9 14 0'), line('M133 121 q7 -9 14 0'), line('M110 134 q13 14 26 0')],
  content: [
    eye(106, 120, 5, 7), eye(140, 120, 5, 7),
    { d: circle(108, 117, 1.8), fill: '#ffffff' }, { d: circle(142, 117, 1.8), fill: '#ffffff' },
    line('M115 136 q8 7 16 0'),
  ],
  drifting: [eye(106, 122, 5, 4.5), eye(140, 122, 5, 4.5), line('M99 116 h13 M133 116 h13', 2.4), line('M117 138 h12')],
  gloomy: [eye(106, 124, 4.5, 5), eye(140, 124, 4.5, 5), line('M98 114 l13 4 M148 114 l-13 4', 2.4), line('M115 141 q8 -6 16 0')],
  stormy: [
    line('M99 122 q7 6 14 0'), line('M133 122 q7 6 14 0'), eye(123, 138, 3.5, 3),
    { d: 'M170 52 h10 l-10 12 h10', stroke: '#dfe6f2', strokeWidth: 2.6 },
    { d: 'M186 38 h7 l-7 9 h7', stroke: '#dfe6f2', strokeWidth: 2.2 },
  ],
};

/** Decorations keyed by asset_key. Backgrounds are drawn by SkyBackground instead. */
export const DECOR: Record<string, Shape[]> = {
  sunhat: [
    { d: ellipse(122, 44, 60, 11), fill: '#f1cd72' },
    { d: 'M92 45 Q93 11 122 11 Q151 11 152 45 Z', fill: '#f7dc90' },
    { d: 'M93 37 Q122 29 151 37 L151.6 44 Q122 36 92.4 44 Z', fill: '#e8665a' },
  ],
  beanie: [
    { d: 'M84 52 Q85 8 122 8 Q159 8 160 52 Z', fill: '#6f8ff0' },
    { d: 'M96 22 v26 M110 13 v35 M122 10 v38 M134 13 v35 M148 22 v26', stroke: '#5c7bdc', strokeWidth: 3 },
    { d: 'M86.5 42 h71 a7.5 7.5 0 0 1 0 15 h-71 a7.5 7.5 0 0 1 0 -15Z', fill: '#5574d6' },
    { d: circle(122, 7, 9), fill: '#f4f6fb' },
  ],
  crown: [
    { d: 'M97 48 L99 16 L111 32 L122 8 L133 32 L145 16 L147 48 Z', fill: '#ffcc4d' },
    { d: 'M97 48 L99 16 L111 32 L122 8 L133 32 L145 16 L147 48 Z', stroke: '#dca42a', strokeWidth: 2 },
    { d: circle(122, 38, 4), fill: '#e8665a' },
    { d: circle(106, 40, 3), fill: '#6f8ff0' },
    { d: circle(138, 40, 3), fill: '#6f8ff0' },
  ],
  cheeks: [
    { d: ellipse(92, 134, 9, 5), fill: '#ff9fb0', opacity: 0.75 },
    { d: ellipse(154, 134, 9, 5), fill: '#ff9fb0', opacity: 0.75 },
  ],
  specs: [
    { d: circle(106, 121, 13), fill: 'rgba(255,255,255,0.25)' },
    { d: circle(140, 121, 13), fill: 'rgba(255,255,255,0.25)' },
    { d: `${circle(106, 121, 13)} ${circle(140, 121, 13)}`, stroke: INK, strokeWidth: 3 },
    { d: 'M119 119 q4 -4 8 0 M93 119 l-12 -4 M153 119 l12 -4', stroke: INK, strokeWidth: 3 },
  ],
  scarf: [
    { d: 'M58 148 Q122 170 186 148 L188 163 Q122 185 56 163 Z', fill: '#e8615a' },
    { d: 'M82 157 l4 15 M104 162 l3 15 M140 162 l-2 15 M162 157 l-4 15', stroke: '#f3a19a', strokeWidth: 3, opacity: 0.7 },
    { d: 'M146 165 L156 200 L172 196 L166 162 Z', fill: '#d24e48' },
  ],
  balloon: [
    { d: 'M190 138 Q205 108 214 74', stroke: '#8792a8', strokeWidth: 1.8 },
    { d: ellipse(216, 51, 17, 22), fill: '#ff6b6b' },
    { d: ellipse(210, 43, 4, 7), fill: '#ffffff', opacity: 0.45 },
    { d: 'M212 72 l4 -2 l4 2 z', fill: '#e85656' },
  ],
};

/** Which decorations draw behind the body (balloon string) vs. in front of it. */
export const BEHIND_BODY = new Set(['balloon']);

/** A four-point sparkle centred at (x, y). */
export const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - 10 * s} Q${x + 1.5 * s} ${y - 1.5 * s} ${x + 10 * s} ${y} Q${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 10 * s} ` +
  `Q${x - 1.5 * s} ${y + 1.5 * s} ${x - 10 * s} ${y} Q${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 10 * s}Z`;
