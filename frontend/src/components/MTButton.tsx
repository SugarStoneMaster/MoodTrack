// src/components/MTButton.tsx
import React, { useRef } from 'react';
import { Pressable, Text, Animated, StyleSheet } from 'react-native';
import { fonts, spacing, useTheme } from '../theme';
import { tapLight } from '../lib/haptics';

export default function MTButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <Pressable
      onPress={() => { tapLight(); onPress(); }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={{ alignSelf: 'stretch' }}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: theme.colors.primary, transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.txt, { color: theme.colors.primaryOn }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing(1.5),
    borderRadius: 12,
    alignItems: 'center',
  },
  txt: { ...fonts.h2, fontWeight: '600' },
});