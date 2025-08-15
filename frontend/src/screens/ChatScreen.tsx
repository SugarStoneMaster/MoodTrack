import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet } from 'react-native';
import MTButton from '../components/MTButton';
import { chat } from '../api/client';
import { theme, spacing, fonts } from '../theme';

type Msg = { role: 'user'|'assistant', content: string };

export default function ChatScreen() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const msg = input.trim(); if (!msg) return;
    const h = [...history, { role:'user', content: msg }];
    setHistory(h); setInput(''); setBusy(true);
    try {
      const res = await chat(msg, h);
      const ans = (res?.answer ?? '').trim();
      setHistory([...h, { role:'assistant', content: ans }]);
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.c}>
      <FlatList
        data={history}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingVertical: spacing(1) }}
        renderItem={({item}) => (
          <View style={[styles.bubble, item.role==='user'? styles.user : styles.assistant]}>
            <Text style={styles.txt}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.row}>
        <TextInput style={styles.in} placeholder="Scrivi al tuo confidente…" value={input} onChangeText={setInput} />
        <MTButton title={busy ? '…' : 'Invia'} onPress={send} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  c:{ flex:1, backgroundColor: theme.bg, padding: spacing(2), gap: spacing(1) },
  bubble:{ padding: spacing(1.5), borderRadius: 14, maxWidth:'85%' },
  user:{ alignSelf:'flex-end', backgroundColor:'#DCF8C6' },
  assistant:{ alignSelf:'flex-start', backgroundColor: theme.card, borderWidth:1, borderColor: theme.line },
  txt:{ ...fonts.body, color: theme.text },
  row:{ flexDirection:'row', gap: spacing(1), alignItems:'center' },
  in:{ flex:1, backgroundColor: theme.card, color: theme.text, borderWidth:1, borderColor: theme.line, borderRadius: 12, padding: spacing(1.5) },
});