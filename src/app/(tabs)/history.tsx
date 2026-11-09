import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cloud } from '@/components/cloud/Cloud';
import { Heading, Icon } from '@/components/ui';
import type { EntryRow } from '@/db/database';
import { useJournal } from '@/store/journal';
import { FONTS, type Scene } from '@/theme/scene';
import { useScene } from '@/theme/useScene';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const scene = useScene();
  const c = scene.colors;
  const entries = useJournal((s) => s.entries);
  const petName = useJournal((s) => s.pet?.name ?? 'your cloud');
  const deleteEntry = useJournal((s) => s.deleteEntry);

  // Entries are stored newest first; group them by month.
  const sections = useMemo(() => {
    const out: { title: string; data: EntryRow[] }[] = [];
    for (const e of entries) {
      const title = new Date(e.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const last = out.at(-1);
      if (last?.title === title) last.data.push(e);
      else out.push({ title, data: [e] });
    }
    return out;
  }, [entries]);

  const confirmDelete = (e: EntryRow, close: () => void) => {
    Alert.alert('Delete this entry?', `It will be gone for good. Points and fullness it earned stay with ${petName}.`, [
      { text: 'Keep it', style: 'cancel', onPress: close },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteEntry(e.id) },
    ]);
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 24 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 4 }}>
          <Heading color={c.ink}>History</Heading>
          {entries.length > 0 && (
            <Text style={[styles.hint, { color: c.muted }]}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · tap to read or edit, swipe left to delete
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Cloud mood={scene.mood} equipped={scene.equipped} width={200} still />
          <Text style={[styles.hint, { color: c.muted, textAlign: 'center' }]}>No entries yet. Your first one will show up here.</Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={[styles.month, { color: c.muted }]}>{section.title.toUpperCase()}</Text>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => <Row entry={item} scene={scene} onDelete={confirmDelete} />}
    />
  );
}

function Row({ entry, scene, onDelete }: { entry: EntryRow; scene: Scene; onDelete: (e: EntryRow, close: () => void) => void }) {
  const c = scene.colors;
  const d = new Date(entry.createdAt);
  const firstLine = entry.text.split('\n').find((l) => l.trim()) ?? '';
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={styles.swipe}
      renderRightActions={(_p, _t, methods) => (
        <Pressable style={[styles.delete, { backgroundColor: c.danger }]} onPress={() => onDelete(entry, methods.close)} accessibilityRole="button">
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}>
      <Pressable
        onPress={() => router.push({ pathname: '/entry', params: { id: entry.id } })}
        accessibilityRole="button"
        style={[styles.row, { backgroundColor: c.cardSolid }]}>
        <View style={styles.day}>
          <Text style={[styles.dayNum, { color: c.ink }]}>{d.getDate()}</Text>
          <Text style={[styles.dayName, { color: c.muted }]}>{d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</Text>
        </View>
        <View style={{ width: 26 }}>{entry.mood && <Icon name={entry.mood} color={c.muted} size={26} />}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[styles.first, { color: c.ink }]}>{firstLine}</Text>
          <Text style={[styles.meta, { color: c.muted }]}>
            {entry.wordCount} words{entry.fed ? ` · +${entry.earnedPoints} pts` : ''}{entry.updatedAt !== entry.createdAt ? ' · edited' : ''}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: FONTS.body, fontSize: 12, marginTop: 4 },
  month: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  swipe: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  day: { width: 40, alignItems: 'center' },
  dayNum: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 24 },
  dayName: { fontFamily: FONTS.bodyMedium, fontSize: 11, letterSpacing: 0.5 },
  first: { fontFamily: FONTS.bodyMedium, fontSize: 15 },
  meta: { fontFamily: FONTS.body, fontSize: 12 },
  delete: { width: 88, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#ffffff', fontFamily: FONTS.bodyBold, fontSize: 15 },
});
