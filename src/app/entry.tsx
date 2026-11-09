import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkyBackground } from '@/components/SkyBackground';
import { ENTRY_MOODS, Icon } from '@/components/ui';
import { RULES, countWords, feedsToday, type EntryMood } from '@/game';
import { useJournal } from '@/store/journal';
import { FONTS } from '@/theme/scene';
import { useScene } from '@/theme/useScene';

/** New entry, or read/edit an existing one when opened as /entry?id=... */
export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const scene = useScene();
  const c = scene.colors;

  const existing = useJournal((s) => (id ? s.entries.find((e) => e.id === id) : undefined));
  const entries = useJournal((s) => s.entries);
  const petName = useJournal((s) => s.pet?.name ?? 'your cloud');
  const addEntry = useJournal((s) => s.addEntry);
  const editEntry = useJournal((s) => s.editEntry);
  const deleteEntry = useJournal((s) => s.deleteEntry);

  const [text, setText] = useState(existing?.text ?? '');
  const [mood, setMood] = useState<EntryMood | null>(existing?.mood ?? null);
  const [saving, setSaving] = useState(false);
  const [openedAt] = useState(() => Date.now());

  const when = existing?.createdAt ?? openedAt;
  const n = countWords(text);
  const fedToday = feedsToday(entries, openedAt).length;

  let note: string;
  let ready = false;
  if (existing) note = existing.fed ? 'Edits keep what this entry earned.' : "Edits don't feed your cloud.";
  else if (n < RULES.minWordsToFeed) note = `${RULES.minWordsToFeed - n} more to feed ${petName}`;
  else if (fedToday >= RULES.maxFeedsPerDay) note = `Saved as a journal entry (${RULES.maxFeedsPerDay} feedings done today)`;
  else {
    ready = true;
    note = n > RULES.longEntryWords ? 'Ready to feed · long entry' : 'Ready to feed';
  }

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      if (existing) await editEntry(existing.id, text, mood);
      else await addEntry(text, mood);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete this entry?', `It will be gone for good. Points and fullness it earned stay with ${petName}.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteEntry(existing.id).then(() => router.back()) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <SkyBackground sky={scene.sky} background={scene.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.cancel, { color: c.muted }]}>Cancel</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.day, { color: c.ink }]}>{new Date(when).toLocaleDateString(undefined, { weekday: 'long' })}</Text>
            <Text style={[styles.date, { color: c.muted }]}>
              {new Date(when).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <Pressable
            onPress={save}
            disabled={!text.trim() || saving}
            accessibilityRole="button"
            style={[styles.save, { backgroundColor: c.ink, opacity: text.trim() ? 1 : 0.5 }]}>
            <Text style={[styles.saveText, { color: c.sheet }]}>{existing ? 'Save' : 'Feed'}</Text>
          </Pressable>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus={!existing}
          placeholder="What's on your mind today?"
          placeholderTextColor={c.placeholder}
          textAlignVertical="top"
          accessibilityLabel="Journal entry"
          style={[styles.input, { color: c.ink }]}
        />

        <View style={styles.count}>
          <Text style={[styles.countText, { color: c.muted }]}>
            <Text style={{ color: c.ink, fontFamily: FONTS.bodyBold }}>{n}</Text> word{n === 1 ? '' : 's'} ·{' '}
            <Text style={ready ? { color: c.good, fontFamily: FONTS.bodySemi } : undefined}>{note}</Text>
          </Text>
          {existing && (
            <Pressable onPress={confirmDelete} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.delete, { color: c.danger }]}>Delete</Text>
            </Pressable>
          )}
        </View>

        {/* Optional mood picker: round buttons in the bottom eighth of the screen. */}
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="How are you feeling? (optional)"
          style={[styles.moods, { height: height / 8 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: c.tab, borderTopColor: c.line }]}>
          {ENTRY_MOODS.map((m) => {
            const on = mood === m.key;
            return (
              <Pressable
                key={m.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={m.label}
                onPress={() => setMood(on ? null : m.key)}
                style={styles.moodBtn}>
                <View style={[styles.ring, { backgroundColor: on ? c.cardSolid : c.card, borderColor: on ? c.fill : 'transparent', transform: [{ scale: on ? 1.08 : 1 }] }]}>
                  <Icon name={m.key} color={on ? c.ink : c.muted} size={26} strokeWidth={1.7} />
                </View>
                <Text style={[styles.moodLabel, { color: on ? c.ink : c.muted }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  cancel: { fontFamily: FONTS.bodySemi, fontSize: 15 },
  day: { fontFamily: FONTS.display, fontSize: 17, lineHeight: 20 },
  date: { fontFamily: FONTS.bodyMedium, fontSize: 12 },
  save: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 },
  saveText: { fontFamily: FONTS.bodyBold, fontSize: 15 },
  // No border or outline: you write straight onto the sky.
  input: { flex: 1, paddingHorizontal: 20, paddingTop: 8, fontFamily: FONTS.body, fontSize: 17, lineHeight: 27, borderWidth: 0 },
  count: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  countText: { fontFamily: FONTS.body, fontSize: 13, flexShrink: 1 },
  delete: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  moods: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, minHeight: 84 },
  moodBtn: { alignItems: 'center', gap: 4 },
  ring: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  moodLabel: { fontFamily: FONTS.bodySemi, fontSize: 11 },
});
