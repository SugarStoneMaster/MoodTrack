import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Alert, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MTButton from '../components/MTButton';
import { useTheme, spacing, fonts } from '../theme';
import type { Theme } from '../theme';
import { createEntry, promptOfDay as fetchPromptOfDay } from '../api/client';
import { notifyEntryCreated } from '../lib/events';
import { useAuth } from '../auth/AuthContext';
import ChatCoachModal from './ChatCoachModal';

export default function NewEntryScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { username, threadId } = useAuth();
  console.log('[NewEntryScreen] username:', username, 'threadId:', threadId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [pod, setPod] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchPromptOfDay();
        setPod(res?.text?.trim() || null);
      } catch {
        setPod(null);
      }
    })();
  }, []);

  const styles = makeStyles(theme);

  const save = async () => {
    const payload = { title: title.trim() || undefined, content: content.trim() };
    if (!payload.content) {
      Alert.alert('Testo mancante', 'Scrivi qualcosa prima di salvare.');
      return;
    }
    setBusy(true);
    try {
      const created = await createEntry(payload);
      notifyEntryCreated(created?.id ? created : null);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Salvataggio non riuscito');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.c}>
        <TextInput
          style={styles.title}
          placeholder="Titolo"
          placeholderTextColor={theme.colors.subtext}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.in, styles.area]}
          placeholder="Scrivi la tua voce…"
          placeholderTextColor={theme.colors.subtext}
          multiline
          value={content}
          onChangeText={setContent}
        />

        <Pressable
          onPress={() => setShowCoach(true)}
          style={({ pressed }) => [
            styles.coachBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.coachBtnTxt}>Apri Coach</Text>
        </Pressable>

        <MTButton title={busy ? '...' : 'Salva'} onPress={save} />
      </View>

      <ChatCoachModal
        visible={showCoach}
        onClose={() => setShowCoach(false)}
        seed={content || title}
        threadId={threadId}
        getContext={() => ({ title, content })}
        promptOfDayText={pod ?? undefined}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  c: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: spacing(2),
    paddingTop: spacing(3),
    gap: spacing(1.25),
  },
  title: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: spacing(1),
    ...fonts.h2,
  },
  in: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: spacing(1),
    ...fonts.body,
  },
  area: {
    flex: 1,
    minHeight: 130,
    maxHeight: 210,
    textAlignVertical: 'top',
  },
  coachBtn: {
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primarySoftBorder,
    borderRadius: 12,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachBtnTxt: {
    ...fonts.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});