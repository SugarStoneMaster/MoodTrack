import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import MTButton from '../components/MTButton';
import { useAuth } from '../auth/AuthContext';
import { useTheme, fonts, spacing } from '../theme';
import type { Theme } from '../theme';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('testuser1');
  const [password, setPassword] = useState('test123');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try { setBusy(true); await login(email.trim(), password); }
    catch { /* opzionale: Alert */ }
    finally { setBusy(false); }
  };

  const styles = makeStyles(theme);

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Benvenuto</Text>
      <Text style={styles.subtitle}>Accedi per continuare</Text>

      <TextInput
        style={styles.in}
        placeholder="Email"
        placeholderTextColor={theme.colors.subtext}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.in}
        placeholder="Password"
        placeholderTextColor={theme.colors.subtext}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <MTButton title={busy ? '...' : 'Accedi'} onPress={submit} />
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  c: { flex:1, backgroundColor: theme.colors.bg, padding: spacing(3), justifyContent:'center', gap: spacing(1.5) },
  title: { ...fonts.title, color: theme.colors.text },
  subtitle: { ...fonts.body, color: theme.colors.subtext, marginBottom: spacing(2) },
  in: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 12,
    padding: spacing(1.5),
  },
});