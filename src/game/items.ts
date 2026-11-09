import raw from './items.json';
import type { Item, Slot } from './types';

export const ITEMS: readonly Item[] = raw as Item[];
export const SLOTS: readonly { slot: Slot; label: string }[] = [
  { slot: 'hat', label: 'Hats' },
  { slot: 'face', label: 'Face' },
  { slot: 'accessory', label: 'Accessories' },
  { slot: 'background', label: 'Backgrounds' },
];

export const itemById = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
