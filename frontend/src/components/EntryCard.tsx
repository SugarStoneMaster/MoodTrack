import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Entry } from '../api/types';
import { theme, fonts, spacing } from '../theme';

export default function EntryCard({ item }: { item: Entry }) {
  const date = new Date(item.created_at).toLocaleString();
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.mood}>{item.mood ?? '–'}</Text>
      </View>
      <Text style={styles.content}>{item.content}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: theme.card, borderRadius: 14, padding: spacing(2), marginVertical: spacing(1), borderWidth: 1, borderColor: theme.line },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { ...fonts.small, color: theme.subtext },
  mood: { ...fonts.h2, color: theme.text },
  content: { ...fonts.body, color: theme.text, marginTop: spacing(1) },
});