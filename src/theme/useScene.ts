import { useMemo } from 'react';

import { moodFor } from '@/game';
import { selectEquipped, useJournal } from '@/store/journal';

import { sceneFor } from './scene';

/** The current sky and colour set, from the cloud's mood and any equipped background. */
export function useScene() {
  const fullness = useJournal((s) => s.pet?.fullness ?? 70);
  const inventory = useJournal((s) => s.inventory);
  const equipped = useMemo(() => selectEquipped(inventory), [inventory]);
  const mood = moodFor(fullness);
  return useMemo(() => ({ ...sceneFor(mood, equipped.background), mood, equipped }), [mood, equipped]);
}
