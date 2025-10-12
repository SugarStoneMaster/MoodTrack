import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { fonts, spacing, useTheme } from '../theme';
import { useRoute } from '@react-navigation/native';
import type { Entry } from '../api/types';

const moods = [
  { value: 1, emoji: '😢' },
  { value: 2, emoji: '😟' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];

export function EntryDetailView({ entry }: { entry: Entry }) {
  const { theme } = useTheme();
  const date = new Date(entry.created_at).toLocaleString();

  return (
    <View style={[styles.c, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {entry.title || 'Voce'}
      </Text>
      <Text style={[styles.date, { color: theme.colors.subtext }]}>
        {date}
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(4) }}>
        <Text style={[styles.content, { color: theme.colors.text }]}>{entry.content}</Text>

        {entry.mood != null && (
          <View style={styles.moodWrap}>
            <Text style={[styles.mLabel, { color: theme.colors.subtext }]}>Mood</Text>
            <View style={styles.moodsRow}>
              {moods.map((m) => (
                <Text
                  key={m.value}
                  style={[
                    styles.mood,
                    { color: theme.colors.text },
                    entry.mood === m.value && styles.moodSelected,
                  ]}
                >
                  {m.emoji}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function EntryDetailScreen() {
  const route = useRoute<any>();
  const entry: Entry | undefined = route.params?.entry;
  if (!entry) return null;
  return <EntryDetailView entry={entry} />;
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: spacing(2), gap: spacing(1) },
  title: { ...fonts.h2 },
  date: { ...fonts.small, marginBottom: spacing(1) },
  content: { ...fonts.body },

  mLabel: { ...fonts.small, marginTop: spacing(2), marginBottom: spacing(1) },
  moodsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(1) },
  mood: { fontSize: 32, opacity: 0.45 },
  moodSelected: { opacity: 1, transform: [{ scale: 1.2 }] },
  moodWrap: { marginTop: spacing(1) },
});