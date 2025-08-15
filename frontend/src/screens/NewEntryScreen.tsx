import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import MTButton from '../components/MTButton';
import { createEntry } from '../api/client';
import { spacing, theme, fonts } from '../theme';
import { notifySuccess } from '../lib/haptics';

export default function NewEntryScreen({ navigation }: any) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');

  const save = async () => {
    const val = mood === '' ? null : Math.max(0, Math.min(10, Number(mood)));
    await createEntry(content.trim(), Number.isFinite(val as any) ? (val as number) : null);
    notifySuccess();
    navigation.goBack();
  };

  return (
    <View style={styles.c}>
      <TextInput style={[styles.in, styles.area]} placeholder="Scrivi come ti senti…" multiline value={content} onChangeText={setContent} />
      <TextInput style={styles.in} placeholder="Mood (0–10, opzionale)" value={mood} onChangeText={setMood} keyboardType="number-pad" />
      <MTButton title="Salva" onPress={save} />
    </View>
  );
}
const styles = StyleSheet.create({
  c:{ flex:1, backgroundColor: theme.bg, padding: spacing(2), gap: spacing(1.5) },
  in:{ backgroundColor: theme.card, color: theme.text, borderWidth:1, borderColor: theme.line, borderRadius: 12, padding: spacing(1.5), ...fonts.body },
  area:{ height: 140, textAlignVertical: 'top' },
});