// Per-weight imports so only these font files are bundled.
import { Baloo2_700Bold } from '@expo-google-fonts/baloo-2/700Bold';
import { Dongle_700Bold } from '@expo-google-fonts/dongle/700Bold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Modak_400Regular } from '@expo-google-fonts/modak/400Regular';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useJournal } from '@/store/journal';
import { useScene } from '@/theme/useScene';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Modak_400Regular, Dongle_700Bold, Baloo2_700Bold,
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold,
  });
  const ready = useJournal((s) => s.ready);
  const init = useJournal((s) => s.init);
  const refresh = useJournal((s) => s.refresh);
  const { dark } = useScene();

  useEffect(() => {
    init().catch((e: unknown) => console.error('Could not open the journal database', e));
  }, [init]);

  // Fullness decays from last_updated whenever the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (fontsLoaded && ready) void SplashScreen.hideAsync();
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entry" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
