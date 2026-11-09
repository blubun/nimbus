import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Cloud } from '@/components/cloud/Cloud';
import { SkyBackground } from '@/components/SkyBackground';
import { FeedButton, Heading } from '@/components/ui';
import { useJournal } from '@/store/journal';
import { FONTS, sceneFor } from '@/theme/scene';

const scene = sceneFor('content');

/** First launch: name your cloud, then go to the Cloud screen. */
export default function Onboarding() {
  const [name, setName] = useState('');
  const createPet = useJournal((s) => s.createPet);
  const c = scene.colors;

  const start = async () => {
    await createPet(name);
    router.replace('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <SkyBackground sky={scene.sky} />
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ alignItems: 'center' }}>
          <Cloud mood="content" width={240} />
        </View>
        <Heading color={c.ink} style={{ textAlign: 'center', fontSize: 44, lineHeight: 48 }}>Meet your cloud</Heading>
        <Text style={[styles.sub, { color: c.muted }]}>Every entry you write keeps it fluffy and happy. What should we call it?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nimbus"
          placeholderTextColor="#9aa8c0"
          maxLength={20}
          returnKeyType="go"
          onSubmitEditing={start}
          accessibilityLabel="Cloud name"
          style={[styles.input, { color: c.ink }]}
        />
        <FeedButton label="Say hello" scene={scene} onPress={start} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, gap: 14 },
  sub: { fontFamily: FONTS.body, fontSize: 15, textAlign: 'center' },
  input: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, fontFamily: FONTS.bodySemi, fontSize: 20, textAlign: 'center' },
});
