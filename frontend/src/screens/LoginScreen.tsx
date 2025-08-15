import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import MTButton from '../components/MTButton';
import { useAuth } from '../auth/AuthContext';
import { theme, fonts, spacing } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    try { setBusy(true); await login(email.trim(), password); } 
    catch (e: any) { /* potresti mostrare un Alert */ } 
    finally { setBusy(false); }
  };

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Benvenuto</Text>
      <Text style={styles.subtitle}>Accedi per continuare</Text>
      <TextInput style={styles.in} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.in} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <MTButton title={busy ? '...' : 'Accedi'} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex:1, backgroundColor: theme.bg, padding: spacing(3), justifyContent:'center', gap: spacing(1.5) },
  title: { ...fonts.title, color: theme.text },
  subtitle: { ...fonts.body, color: theme.subtext, marginBottom: spacing(2) },
  in: { backgroundColor: theme.card, color: theme.text, borderWidth: 1, borderColor: theme.line, borderRadius: 12, padding: spacing(1.5) },
});