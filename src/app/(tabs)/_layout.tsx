import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { SkyBackground } from '@/components/SkyBackground';
import { TabBar } from '@/components/TabBar';
import { useJournal } from '@/store/journal';
import { useScene } from '@/theme/useScene';

export default function TabsLayout() {
  const hasPet = useJournal((s) => s.pet !== null);
  const { sky, background } = useScene();

  if (!hasPet) return <Redirect href="/onboarding" />;

  return (
    <View style={{ flex: 1 }}>
      {/* One sky behind every tab; the screens themselves are transparent. */}
      <SkyBackground sky={sky} background={background} />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="shop" />
      </Tabs>
    </View>
  );
}
