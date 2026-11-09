import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS, type Scene } from '@/theme/scene';

import { Heading } from './ui';

export function Sheet({ visible, onClose, title, scene, children }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  scene: Scene;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const c = scene.colors;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: c.sheet, paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
        <View style={[styles.grab, { backgroundColor: c.line }]} />
        <Heading level={3} color={c.ink}>{title}</Heading>
        {children}
      </View>
    </Modal>
  );
}

export function SheetButton({ label, onPress, kind = 'plain', scene, disabled }: {
  label: string;
  onPress: () => void;
  kind?: 'plain' | 'primary' | 'dark' | 'danger';
  scene: Scene;
  disabled?: boolean;
}) {
  const c = scene.colors;
  const bg = { plain: c.soft, primary: c.accent, dark: c.ink, danger: c.danger }[kind];
  const fg = { plain: c.ink, primary: c.accentInk, dark: c.sheet, danger: '#ffffff' }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}>
      <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(15,22,40,0.4)' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  grab: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 6 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnLabel: { fontFamily: FONTS.bodyBold, fontSize: 16 },
});
