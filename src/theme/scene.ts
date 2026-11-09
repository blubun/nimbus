import type { CloudMood } from '@/game/types';

export const FONTS = {
  /** All h1, h2 and h3 headings. */
  heading: 'Modak_400Regular',
  /** The "Feed your cloud" button. */
  button: 'Dongle_700Bold',
  display: 'Baloo2_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

export const MOOD_COPY: Record<CloudMood, { label: string; status: (name: string) => string }> = {
  radiant: { label: 'Radiant', status: (n) => `${n} is glowing today.` },
  content: { label: 'Content', status: (n) => `${n} is feeling cozy and content.` },
  drifting: { label: 'Drifting', status: (n) => `${n} is drifting a little. A few words would help.` },
  gloomy: { label: 'Gloomy', status: (n) => `${n} is feeling drizzly.` },
  stormy: { label: 'Stormy', status: (n) => `${n} is napping under a little storm. One entry brings it back.` },
};

const MOOD_SKIES: Record<CloudMood, [string, string]> = {
  radiant: ['#86ccff', '#e4f5ff'],
  content: ['#a6d3f3', '#e9f3fb'],
  drifting: ['#b4c5d7', '#e5ebf2'],
  gloomy: ['#93a1b4', '#cbd3de'],
  stormy: ['#454f63', '#717d93'],
};

/** A bought background sets its own sky; otherwise the sky follows the cloud's mood. */
const BACKGROUND_SKIES: Record<string, { sky: [string, string]; dark: boolean }> = {
  rainbow: { sky: ['#b9e0ff', '#ffe0ee'], dark: false },
  stars: { sky: ['#141c44', '#3e3f80'], dark: true },
};

export interface Scene {
  sky: [string, string];
  dark: boolean;
  background?: string;
  colors: {
    ink: string;
    muted: string;
    card: string;
    cardSolid: string;
    soft: string;
    line: string;
    sheet: string;
    tab: string;
    placeholder: string;
    floaty: string;
    accent: string;
    accentInk: string;
    accentShadow: string;
    fill: string;
    danger: string;
    good: string;
  };
}

export function sceneFor(mood: CloudMood, background?: string): Scene {
  const bg = background ? BACKGROUND_SKIES[background] : undefined;
  const sky = bg?.sky ?? MOOD_SKIES[mood];
  const dark = bg?.dark ?? mood === 'stormy';
  const shared = { accent: '#ff9a3c', accentInk: '#3d2100', accentShadow: '#a65f1f', fill: '#58a8f0', danger: '#d9534f', good: '#2f9e6e' };
  const colors = dark
    ? {
        ...shared, ink: '#eef2fb', muted: '#c0c9de', card: 'rgba(16,22,48,0.42)', cardSolid: '#262f58',
        soft: 'rgba(255,255,255,0.13)', line: 'rgba(255,255,255,0.18)', sheet: '#1d2547',
        tab: mix(sky[1], '#000000', 0.18), placeholder: '#e4eaff', floaty: '#eef3ff', fill: '#6cb6f5',
      }
    : {
        ...shared, ink: '#21304c', muted: '#4c5a77', card: 'rgba(255,255,255,0.62)', cardSolid: '#fbfdff',
        soft: 'rgba(255,255,255,0.5)', line: 'rgba(30,50,90,0.14)', sheet: '#f4f7fc',
        tab: mix(sky[1], '#ffffff', 0.22), placeholder: '#ffffff', floaty: '#3c5c9c',
      };
  return { sky, dark, background, colors };
}

/** Mixes two #rrggbb colours; t = share of `b`. */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(ar!, br!)}${c(ag!, bg!)}${c(ab!, bb!)}`;
}
