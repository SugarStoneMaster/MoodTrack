import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import MTButton from '../components/MTButton';
import { createEntry } from '../api/client';
import { spacing, useTheme, fonts } from '../theme';
import type { Theme } from '../theme';
import { notifySuccess, tapLight } from '../lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function WriteScreen() {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const nav = useNavigation<any>();

  const styles = makeStyles(theme);

  const save = async () => {
    const val = mood === '' ? null : Math.max(0, Math.min(10, Number(mood)));
    await createEntry(content.trim(), Number.isFinite(val as any) ? (val as number) : null);
    notifySuccess();
    setContent(''); setMood('');
  };

  return (
    <View style={styles.c}>
      <TextInput
        style={[styles.in, styles.area]}
        placeholder="Scrivi come ti senti…"
        placeholderTextColor={theme.colors.subtext}
        multiline
        value={content}
        onChangeText={setContent}
      />
      <TextInput
        style={styles.in}
        placeholder="Mood (0–10, opzionale)"
        placeholderTextColor={theme.colors.subtext}
        value={mood}
        onChangeText={setMood}
        keyboardType="number-pad"
      />
      <MTButton title="Salva" onPress={save} />

      <Pressable
        onPress={() => { tapLight(); nav.navigate('ChatModal'); }}
        style={styles.fab}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  c:{ flex:1, backgroundColor: theme.colors.bg, padding: spacing(2), gap: spacing(1.5) },
  in:{
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderWidth:1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: spacing(1.5),
    ...fonts.body
  },
  area:{ height: 180, textAlignVertical: 'top' },
  fab:{
    position:'absolute',
    right: spacing(2),
    bottom: spacing(2),
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: spacing(1.5),
    shadowColor:'#000', shadowOpacity:0.15, shadowRadius:8, shadowOffset:{width:0,height:4},
    elevation:4
  }
});