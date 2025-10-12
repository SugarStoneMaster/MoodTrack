import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MTButton from '../components/MTButton';
import { useAuth } from '../auth/AuthContext';
import { getProfile } from '../api/client';
import { getCachedProfile, primeProfile } from '../lib/dataCache';
import { useTheme, fonts, spacing } from '../theme';
import type { Theme } from '../theme';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { username, logout } = useAuth();

  const [displayName, setDisplayName] = useState<string>(
    getCachedProfile()?.display_name || username || '—'
  );
  const [email, setEmail] = useState<string>(getCachedProfile()?.email || '—');

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        primeProfile(profile);
        setDisplayName(profile.display_name || profile.username || '—');
        setEmail(profile.email || '—');
      } catch (err) {
        console.error('Errore caricamento profilo', err);
        Alert.alert('Errore', 'Impossibile caricare il profilo');
      }
    })();
  }, []);

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.c}>
        <Text style={styles.title}>Profilo</Text>

        <Text style={styles.label}>Nome utente</Text>
        <Text style={styles.value}>{displayName}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email || '—'}</Text>

        <View style={{ height: spacing(2) }} />
        <MTButton title="Logout" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  c: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: spacing(2),
    gap: spacing(2),
  },
  title: { ...fonts.title, color: theme.colors.text },
  label: { ...fonts.body, color: theme.colors.subtext },
  value: { ...fonts.h2, color: theme.colors.text },
});