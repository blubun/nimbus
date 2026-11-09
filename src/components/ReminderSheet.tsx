import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { REMINDER_BODY } from '@/notifications/reminder';
import { useJournal } from '@/store/journal';
import { FONTS, type Scene } from '@/theme/scene';

import { Sheet, SheetButton } from './Sheet';

const TIMES: [number, number][] = [[8, 0], [12, 30], [18, 0], [20, 0], [21, 30]];
const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export function ReminderSheet({ visible, onClose, scene }: { visible: boolean; onClose: () => void; scene: Scene }) {
  const c = scene.colors;
  const settings = useJournal((s) => s.settings);
  const name = useJournal((s) => s.pet?.name ?? 'Your cloud');
  const setReminder = useJournal((s) => s.setReminder);
  const [declined, setDeclined] = useState(false);

  const toggle = async (on: boolean) => {
    const ok = await setReminder(on);
    setDeclined(!ok);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Daily reminder" scene={scene}>
      <Text style={[styles.sub, { color: c.muted }]}>One gentle nudge a day. No streak warnings.</Text>
      <View style={[styles.row, { borderBottomColor: c.line }]}>
        <Text style={[styles.label, { color: c.ink }]}>Remind me to write</Text>
        <Switch value={settings.reminderOn} onValueChange={toggle} trackColor={{ true: c.good }} accessibilityLabel="Daily reminder" />
      </View>
      {declined && (
        <Text style={[styles.sub, { color: c.danger }]}>
          Notifications are off for Cloud Journal. Turn them on in your phone’s Settings, then try again.
        </Text>
      )}
      <View style={[styles.row, { borderBottomColor: c.line, opacity: settings.reminderOn ? 1 : 0.5 }]}>
        <Text style={[styles.label, { color: c.ink }]}>Time</Text>
        <View style={styles.times}>
          {TIMES.map(([h, m]) => {
            const on = settings.reminderHour === h && settings.reminderMinute === m;
            return (
              <Pressable
                key={fmt(h, m)}
                disabled={!settings.reminderOn}
                onPress={() => void setReminder(true, h, m)}
                accessibilityState={{ selected: on }}
                style={[styles.time, { backgroundColor: on ? c.ink : c.soft }]}>
                <Text style={[styles.timeText, { color: on ? c.sheet : c.ink }]}>{fmt(h, m)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {settings.reminderOn && (
        <View style={[styles.preview, { backgroundColor: c.cardSolid }]}>
          <Text style={[styles.label, { color: c.ink }]}>Cloud Journal · {fmt(settings.reminderHour, settings.reminderMinute)}</Text>
          <Text style={[styles.sub, { color: c.muted }]}>{REMINDER_BODY} {name} is around.</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <SheetButton label="Done" kind="dark" scene={scene} onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: FONTS.body, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 15 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', flex: 1 },
  time: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 9 },
  timeText: { fontFamily: FONTS.bodySemi, fontSize: 13 },
  preview: { borderRadius: 16, padding: 12, gap: 2 },
});
