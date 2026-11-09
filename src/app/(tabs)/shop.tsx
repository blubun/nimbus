import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cloud } from '@/components/cloud/Cloud';
import { Sheet, SheetButton } from '@/components/Sheet';
import { SkyBackground } from '@/components/SkyBackground';
import { Coin, Heading } from '@/components/ui';
import { ITEMS, SLOTS, canBuy, itemById, moodFor, type Item } from '@/game';
import { selectEquipped, useJournal } from '@/store/journal';
import { FONTS, sceneFor, type Scene } from '@/theme/scene';
import { useScene } from '@/theme/useScene';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const scene = useScene();
  const c = scene.colors;
  const pet = useJournal((s) => s.pet)!;
  const inventory = useJournal((s) => s.inventory);
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={styles.head}>
          <Heading color={c.ink}>Shop</Heading>
          <View style={styles.balance}>
            <Coin size={20} />
            <Text style={[styles.balanceText, { color: c.ink }]}>{pet.points}</Text>
          </View>
        </View>
        {SLOTS.map(({ slot, label }) => (
          <View key={slot}>
            <Text style={[styles.slot, { color: c.muted }]}>{label.toUpperCase()}</Text>
            <View style={styles.grid}>
              {ITEMS.filter((i) => i.slot === slot).map((item) => {
                const own = inventory.find((r) => r.itemId === item.id);
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    scene={scene}
                    owned={!!own}
                    equipped={!!own?.equipped}
                    affordable={pet.points >= item.price}
                    onPress={() => setPreviewId(item.id)}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <PreviewSheet itemId={previewId} onClose={() => setPreviewId(null)} scene={scene} />
    </>
  );
}

function ItemCard({ item, scene, owned, equipped, affordable, onPress }: {
  item: Item; scene: Scene; owned: boolean; equipped: boolean; affordable: boolean; onPress: () => void;
}) {
  const c = scene.colors;
  const isBg = item.slot === 'background';
  const thumb = isBg ? sceneFor('content', item.assetKey) : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${equipped ? 'wearing' : owned ? 'owned' : `${item.price} points`}`}
      style={[styles.card, { backgroundColor: c.card, borderColor: equipped ? c.fill : 'transparent' }]}>
      <View style={[styles.thumb, { backgroundColor: c.soft }]}>
        {thumb && <SkyBackground sky={thumb.sky} background={item.assetKey} width={150} height={112} rainbowCenter={0.95} />}
        <Cloud mood="content" equipped={isBg ? {} : { [item.slot]: item.assetKey }} width={120} still />
      </View>
      <Text style={[styles.name, { color: c.ink }]}>{item.name}</Text>
      {equipped ? (
        <Text style={[styles.tag, { color: c.fill }]}>Wearing</Text>
      ) : owned ? (
        <Text style={[styles.tag, { color: c.muted }]}>Owned</Text>
      ) : (
        <View style={styles.price}>
          <Coin size={14} />
          <Text style={[styles.tag, { color: affordable ? c.ink : c.muted }]}>{item.price}</Text>
        </View>
      )}
    </Pressable>
  );
}

function PreviewSheet({ itemId, onClose, scene }: { itemId: string | null; onClose: () => void; scene: Scene }) {
  const c = scene.colors;
  const pet = useJournal((s) => s.pet)!;
  const inventory = useJournal((s) => s.inventory);
  const buy = useJournal((s) => s.buy);
  const setEquipped = useJournal((s) => s.setEquipped);
  const item = itemId ? itemById(itemId) : undefined;
  if (!item) return null;

  const own = inventory.find((r) => r.itemId === item.id);
  const points = pet.points;
  const mood = moodFor(pet.fullness);
  const equipped = { ...selectEquipped(inventory), [item.slot]: item.assetKey };
  const preview = sceneFor(mood, equipped.background);
  const sub = own
    ? 'You own this. Swap it any time.'
    : points >= item.price
      ? `You have ${points} points.`
      : `You need ${item.price - points} more points. A few more entries will get you there.`;

  return (
    <Sheet visible onClose={onClose} title={item.name} scene={scene}>
      <Text style={[styles.sub, { color: c.muted }]}>{sub}</Text>
      <View style={styles.preview}>
        <SkyBackground sky={preview.sky} background={equipped.background} width={360} height={210} rainbowCenter={0.95} />
        <Cloud mood={mood} equipped={equipped} width={240} />
      </View>
      <View style={styles.actions}>
        <SheetButton label="Close" scene={scene} onPress={onClose} />
        {own?.equipped ? (
          <SheetButton label="Take off" scene={scene} onPress={() => void setEquipped(item.id, false)} />
        ) : own ? (
          <SheetButton label="Wear it" kind="dark" scene={scene} onPress={() => void setEquipped(item.id, true)} />
        ) : (
          <SheetButton
            label={`Buy for ${item.price} points`}
            kind="primary"
            scene={scene}
            disabled={!canBuy(pet, item, new Set(inventory.map((r) => r.itemId)))}
            onPress={() => void buy(item.id).then((ok) => ok && onClose())}
          />
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceText: { fontFamily: FONTS.display, fontSize: 20 },
  slot: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', flexGrow: 1, maxWidth: '50%', borderRadius: 18, borderWidth: 1.5, padding: 8, paddingBottom: 10, alignItems: 'center', gap: 2 },
  thumb: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { fontFamily: FONTS.bodySemi, fontSize: 14, marginTop: 4 },
  tag: { fontFamily: FONTS.bodyBold, fontSize: 13 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub: { fontFamily: FONTS.body, fontSize: 14 },
  preview: { height: 210, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
});
