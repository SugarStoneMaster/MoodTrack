import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet, Pressable, FlatList,
  KeyboardAvoidingView, Platform, Alert, Switch, Animated, Easing
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, spacing, useTheme } from '../theme';
import { chat as chatApi } from '../api/client';
import type { ChatbotResponse } from '../api/types';

type Msg = { id: string; role: 'user' | 'assistant'; content: string; loading?: boolean };

export default function ChatCoachModal({
  visible, onClose, seed, threadId, getContext, promptOfDayText,
}: {
  visible: boolean;
  onClose: () => void;
  seed?: string;
  threadId: string | null | undefined;
  getContext?: () => { title: string; content: string };
  promptOfDayText?: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [useContext, setUseContext] = useState(true);
  const listRef = useRef<FlatList<Msg>>(null);

  const hasUserMessage = useMemo(
    () => messages.some(m => m.role === 'user'),
    [messages]
  );

  useEffect(() => {
    if (visible) {
      setMessages(prev =>
        prev.length ? prev : [{
          id: 'welcome', role: 'assistant',
          content:
            'Ciao! Posso aiutarti a chiarire o riformulare. Puoi condividere (o disattivare) il contesto della tua bozza qui sopra.',
        }]
      );
      if (seed && !input) setInput('');
    } else {
      setInput(''); setSending(false);
    }
  }, [visible, seed]);

  function buildAugmentedMessage(userText: string): string {
    if (!useContext || !getContext) return userText;
    const { title, content } = getContext();
    const trimmed = (content || '').slice(0, 1200);
    const t = (title || '').slice(0, 120);

    const prompt =
`[CONTESTO_ENTRY]
Titolo: ${t || '—'}
Testo:
${trimmed}
[/CONTESTO_ENTRY]

Sei un supporto psicologico empatico: proponi domande di approfondimento o riformulazioni brevi.
Utente: ${userText}`;

    return prompt.slice(0, 2000);
  }

  const sendText = async (textRaw: string) => {
    const text = textRaw.trim();
    if (!text || sending) return;

    if (!threadId) {
      Alert.alert('Attenzione', 'Thread non disponibile: accedi di nuovo oppure riprova.');
      return;
    }

    const userMsg: Msg = { id: String(Date.now()), role: 'user', content: text };
    const loadingMsg: Msg = { id: 'loading', role: 'assistant', content: '', loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setSending(true);

    try {
      const payload = buildAugmentedMessage(text);
      const res = (await chatApi(payload, threadId)) as ChatbotResponse;
      const answer = res?.reply?.trim() || 'Hmm, non sono sicuro. Prova a riformulare 🙂';

      setMessages(prev =>
        prev.map(m => m.id === 'loading'
          ? { id: String(Date.now() + 1), role: 'assistant', content: answer }
          : m
        )
      );
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      setMessages(prev =>
        prev.map(m => m.id === 'loading'
          ? { id: String(Date.now() + 2), role: 'assistant', content: `Errore: ${e?.message || 'Richiesta fallita'}` }
          : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const send = async () => sendText(input);

  const LoadingDots = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    const animate = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 300, delay, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.linear, useNativeDriver: true }),
        ])
      ).start();
    };

    useEffect(() => {
      animate(dot1, 0);
      animate(dot2, 150);
      animate(dot3, 300);
    }, []);

    const styleDot = (anim: Animated.Value) => ({
      opacity: anim,
      backgroundColor: theme.colors.text,
      width: 6, height: 6, borderRadius: 3, marginHorizontal: 2,
    });

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}>
        <Animated.View style={styleDot(dot1)} />
        <Animated.View style={styleDot(dot2)} />
        <Animated.View style={styleDot(dot3)} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { backgroundColor: theme.colors.card, borderColor: theme.colors.line },
          ]}
        >
          {item.loading
            ? <LoadingDots />
            : (
              <Text style={[
                fonts.body,
                { color: isUser ? theme.colors.primaryOn : theme.colors.text },
              ]}>
                {item.content}
              </Text>
            )}
        </View>
      </View>
    );
  };

  const showPromptOfDay = !!promptOfDayText && !hasUserMessage;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.line, backgroundColor: theme.colors.bg }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Coach</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[fonts.body, { color: theme.colors.primary }]}>Chiudi</Text>
          </Pressable>
        </View>

        {/* Toggle contesto */}
        <View style={[
          styles.ctxRow,
          { borderBottomColor: theme.colors.line }
        ]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctxTitle, { color: theme.colors.text }]}>Usa il contesto della bozza</Text>
            <Text style={[styles.ctxNote, { color: theme.colors.subtext }]}>
              Titolo e testo attuali verranno condivisi con il coach mentre scrivi.
            </Text>
          </View>
          <Switch value={useContext} onValueChange={setUseContext} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top - 15}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: spacing(2), paddingBottom: spacing(2) }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />

          {showPromptOfDay && (
            <View style={{ paddingHorizontal: spacing(2), paddingBottom: spacing(1) }}>
              <Pressable
                onPress={() => sendText(promptOfDayText!)}
                style={({ pressed }) => [
                  styles.podBtn,
                  {
                    opacity: pressed ? 0.9 : 1,
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.colors.primarySoftBorder,
                  },
                ]}
              >
                <Text style={[styles.podLabel, { color: theme.colors.primary }]}>Prompt del giorno</Text>
                <Text style={[styles.podText, { color: theme.colors.text }]}>{`“${promptOfDayText}”`}</Text>
                <Text style={[styles.podHint, { color: theme.colors.subtext }]}>Tocca per iniziare</Text>
              </Pressable>
            </View>
          )}

          <View style={[
            styles.composerWrap,
            {
              borderTopColor: theme.colors.line,
              backgroundColor: theme.colors.bg + 'CC',
              paddingBottom: insets.bottom + 8,
            }
          ]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.line,
                }
              ]}
              placeholder="Scrivi un messaggio…"
              placeholderTextColor={theme.colors.subtext}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={send}
              disabled={sending || !input.trim() || !threadId}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  opacity: sending || !input.trim() || !threadId ? 0.6 : (pressed ? 0.8 : 1),
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <MaterialIcons name="send" size={22} color={theme.colors.primaryOn} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(2), paddingTop: spacing(1), paddingBottom: spacing(1),
    borderBottomWidth: 1,
  },
  title: { ...fonts.title },

  ctxRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(1),
    paddingHorizontal: spacing(2), paddingTop: spacing(1), paddingBottom: spacing(0.5),
    borderBottomWidth: 1,
  },
  ctxTitle: { ...fonts.body },
  ctxNote: { ...fonts.small },

  podBtn: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing(1.25),
    marginHorizontal: spacing(1),
  },
  podLabel: { ...fonts.small, marginBottom: 4 },
  podText: { ...fonts.body },
  podHint: { ...fonts.small, marginTop: 4 },

  bubbleRow: { paddingVertical: 4, flexDirection: 'row' },
  bubble: { maxWidth: '85%', borderRadius: 14, padding: spacing(1.25), borderWidth: 1 },

  composerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    gap: spacing(1),
    borderTopWidth: 1,
    paddingVertical: spacing(1),
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: spacing(1), paddingVertical: spacing(1), textAlignVertical: 'top', ...fonts.body,
  },
  sendBtn: { height: 40, width: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});