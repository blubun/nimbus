import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FONTS } from '@/theme/scene';
import { useScene } from '@/theme/useScene';

import { Icon, type IconName } from './ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Cloud', icon: 'cloud' },
  history: { label: 'History', icon: 'book' },
  shop: { label: 'Shop', icon: 'bag' },
};

/** Bottom bar tinted from the current sky, so it changes with mood and bought backgrounds. */
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useScene();
  return (
    <View style={[styles.bar, { backgroundColor: colors.tab, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => !focused && navigateToTab(route.key)}
            style={styles.tab}>
            <Icon name={tab.icon} color={focused ? colors.fill : colors.muted} />
            <Text style={[styles.label, { color: focused ? colors.ink : colors.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 12 },
});
