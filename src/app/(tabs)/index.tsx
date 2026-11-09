import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cloud } from '@/components/cloud/Cloud';
import { ReminderSheet } from '@/components/ReminderSheet';
import { Coin, FeedButton, Flame, Heading, Icon } from '@/components/ui';
import { RULES, currentStreak, feedsToday, type FeedResult } from '@/game';
import { useJournal } from '@/store/journal';
import { FONTS, MOOD_COPY, type Scene } from '@/theme/scene';
import { useScene } from '@/theme/useScene';

export default function CloudScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scene = useScene();
  const c = scene.colors;
  const pet = useJournal((s) => s.pet)!;
  const entries = useJournal((s) => s.entries);
  const lastResult = useJournal((s) => s.lastResult);
  const clearLastResult = useJournal((s) => s.clearLastResult);
  const [reminderOpen, setReminderOpen] = useState(false);
  const feedKey = useJournal((s) => s.feedCount);

  // Hide the result card after a few seconds.
  useEffect(() => {
    if (!lastResult) return;
    const t = setTimeout(clearLastResult, 5000);
    return () => clearTimeout(t);
  }, [lastResult, clearLastResult]);

  // Decay is applied on launch, on foreground and on every save, which all set lastUpdated to the current time.
  const now = pet.lastUpdated;
  const f = Math.round(pet.fullness);
  const fedToday = feedsToday(entries, now).length;
  const hint =
    fedToday === 0
      ? `Your first entry today gives +${RULES.firstFeedFullness} fullness.`
      : fedToday < RULES.maxFeedsPerDay
        ? `Fed ${fedToday} of ${RULES.maxFeedsPerDay} times today. Another entry gives +${RULES.extraFeedFullness}.`
        : `Fed ${RULES.maxFeedsPerDay} of ${RULES.maxFeedsPerDay} times today. You can keep writing.`;

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topbar}>
        <Heading color={c.ink} numberOfLines={1} style={{ flexShrink: 1 }}>{pet.name}</Heading>
        <Pressable accessibilityLabel="Daily reminder" onPress={() => setReminderOpen(true)} style={[styles.iconBtn, { backgroundColor: c.soft }]}>
          <Icon name="bell" color={c.ink} size={20} />
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Stat scene={scene} label="Points" value={pet.points} icon={<Coin />} />
        <Stat scene={scene} label="Day streak" value={currentStreak(pet, now)} icon={<Flame />} />
      </View>

      {/* The cloud fills the space between the stats and the bottom group, centred. */}
      <View style={styles.stage}>
        <Cloud mood={scene.mood} equipped={scene.equipped} width={Math.min(width - 60, 320)} feedKey={feedKey} />
      </View>

      <View style={styles.bottom}>
        <Text style={[styles.status, { color: c.ink }]}>{MOOD_COPY[scene.mood].status(pet.name)}</Text>
        <View style={styles.fullRow}>
          <Text style={[styles.small, { color: c.muted }]}>
            Fullness{'  '}
            <Text style={[styles.chip, { color: c.ink, backgroundColor: c.soft }]}> {MOOD_COPY[scene.mood].label.toUpperCase()} </Text>
          </Text>
          <Text style={[styles.small, { color: c.ink, fontFamily: FONTS.bodyBold }]}>{f} / 100</Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Fullness"
          accessibilityValue={{ min: 0, max: 100, now: f }}
          style={[styles.bar, { backgroundColor: c.soft }]}>
          <View style={[styles.barFill, { width: `${f}%`, backgroundColor: c.fill }]} />
        </View>
        <FeedButton label="Feed your cloud" scene={scene} style={{ marginTop: 14 }} onPress={() => router.push('/entry')} />
        <Text style={[styles.hint, { color: c.muted }]}>{hint}</Text>
      </View>

      {lastResult && <ResultCard result={lastResult} scene={scene} name={pet.name} top={insets.top + 64} onClose={clearLastResult} />}
      <ReminderSheet visible={reminderOpen} onClose={() => setReminderOpen(false)} scene={scene} />
    </View>
  );
}

function Stat({ scene, label, value, icon }: { scene: Scene; label: string; value: number; icon: React.ReactNode }) {
  const c = scene.colors;
  return (
    <View style={[styles.stat, { backgroundColor: c.card }]}>
      {icon}
      <View>
        <Text style={[styles.statValue, { color: c.ink }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: c.muted }]}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function ResultCard({ result, scene, name, top, onClose }: { result: FeedResult; scene: Scene; name: string; top: number; onClose: () => void }) {
  const c = scene.colors;
  return (
    <Animated.View entering={FadeInUp.springify()} exiting={FadeOutUp} style={[styles.result, { top, backgroundColor: c.cardSolid }]}>
      <Pressable onPress={onClose} accessibilityRole="alert">
        {result.fed ? (
          <>
            <Heading level={3} color={c.ink}>Yum, thank you!</Heading>
            <View style={styles.resultBig}>
              <Text style={[styles.resultNum, { color: c.fill }]}>+{result.fullnessGained} fullness</Text>
              <Text style={[styles.resultNum, { color: c.accentShadow }]}>+{result.points} points</Text>
            </View>
            <View style={[styles.lines, { borderTopColor: c.line }]}>
              {result.lines.map((l) => (
                <View key={l.label} style={styles.line}>
                  <Text style={[styles.small, { color: c.muted }]}>{l.label}</Text>
                  <Text style={[styles.small, { color: c.muted }]}>+{l.points}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Heading level={3} color={c.ink}>Entry saved</Heading>
            <Text style={[styles.small, { color: c.muted, marginTop: 4 }]}>
              {result.reason === 'too-short'
                ? `Entries need ${RULES.minWordsToFeed} words to feed ${name}.`
                : `${name} has had ${RULES.maxFeedsPerDay} feedings today.`}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  statValue: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 26 },
  statLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, letterSpacing: 0.5 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  bottom: { paddingBottom: 8 },
  status: { fontFamily: FONTS.bodySemi, fontSize: 15, textAlign: 'center', marginBottom: 12 },
  fullRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  small: { fontFamily: FONTS.body, fontSize: 13 },
  chip: { fontFamily: FONTS.bodyBold, fontSize: 11, letterSpacing: 0.6 },
  bar: { height: 14, borderRadius: 7, overflow: 'hidden', marginTop: 6 },
  barFill: { height: '100%', borderRadius: 7 },
  hint: { fontFamily: FONTS.body, fontSize: 13, textAlign: 'center', marginTop: 8 },
  result: {
    position: 'absolute', left: 16, right: 16, borderRadius: 20, padding: 16,
    shadowColor: '#0f1932', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  resultBig: { flexDirection: 'row', gap: 14, marginTop: 4 },
  resultNum: { fontFamily: FONTS.bodyBold, fontSize: 15 },
  lines: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderStyle: 'dashed', gap: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
});
