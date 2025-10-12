// src/components/EntryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import type { Entry } from '../api/types';
import { fonts, spacing, useTheme } from '../theme';

function moodToEmoji(mood?: number | null): string {
  switch (mood) {
    case 1: return '😢';
    case 2: return '😟';
    case 3: return '😐';
    case 4: return '🙂';
    case 5: return '😄';
    default: return '–';
  }
}

export default function EntryCard({ item, onPress }: { item: Entry; onPress?: () => void }) {
  const { theme } = useTheme();

  const d = new Date(item.created_at);
  const date = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const isPending = item.mood == null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View style={[
        styles.card,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.line }
      ]}>
        {/* Titolo */}
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">
          {item.title || 'Voce'}
        </Text>

        {/* Contenuto */}
        <Text style={[styles.content, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode="tail">
          {item.content}
        </Text>

        {/* Footer */}
        <View style={styles.row}>
          <View style={[
            styles.dateBox,
            { backgroundColor: theme.colors.bg, borderColor: theme.colors.line }
          ]}>
            <Text style={[styles.date, { color: theme.colors.text }]}>{date}</Text>
            <Text style={[styles.time, { color: theme.colors.subtext }]}>{time}</Text>
          </View>
          <View style={styles.moodBox}>
            {isPending ? (
              <ActivityIndicator size="large" color={theme.colors.text} style={styles.spinner} />
            ) : (
              <Text style={styles.mood}>{moodToEmoji(item.mood)}</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: spacing(2),
    marginVertical: spacing(1),
    borderWidth: 1,
    height: 140,
    justifyContent: 'space-between',
  },
  title: { ...fonts.h2, marginBottom: spacing(0.5) },
  content: { ...fonts.body, flexShrink: 1 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(0.5),
  },

  dateBox: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  date: { ...fonts.body, fontWeight: '600' },
  time: { ...fonts.small },

  moodBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mood: { fontSize: 30, lineHeight: 34 },
  spinner: { transform: [{ scale: 1.1 }] },
});