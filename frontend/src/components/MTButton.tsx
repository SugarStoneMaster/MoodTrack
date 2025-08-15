import React, { useRef } from 'react';
import { Pressable, Text, Animated, StyleSheet } from 'react-native';
import { theme, fonts, spacing } from '../theme';
import { tapLight } from '../lib/haptics';

export default function MTButton({ title, onPress }: { title: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <Pressable onPress={() => { tapLight(); onPress(); }} onPressIn={pressIn} onPressOut={pressOut} style={{ alignSelf:'stretch' }}>
      <Animated.View style={[styles.btn, { transform: [{ scale }] }]}>
        <Text style={styles.txt}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.accent,
    paddingVertical: spacing(1.5),
    borderRadius: 12,
    alignItems: 'center',
  },
  txt: { ...fonts.h2, color: '#fff', fontWeight: '600' },
});