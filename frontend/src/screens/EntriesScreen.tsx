import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, FlatList, RefreshControl, StyleSheet, Pressable, Modal, Text, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getEntries, getEntryById } from '../api/client';
import EntryCard from '../components/EntryCard';
import type { Entry } from '../api/types';
import { spacing, fonts, useTheme } from '../theme';
import { onEntryCreated } from '../lib/events';
import { EntryDetailView } from './EntryDetailScreen';
import { getCachedEntries, primeEntries } from '../lib/dataCache';

type PollState = { attempts: number; handle?: ReturnType<typeof setTimeout> };
const PAGE_SIZE = 20;

export default function EntriesScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Entry[]>(() => getCachedEntries() ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState<number>(0);
  const [selected, setSelected] = useState<Entry | null>(null);
  const nav = useNavigation<any>();

  const pollsRef = useRef<Map<number, PollState>>(new Map());
  const loadingMoreRef = useRef(false);

  const normalizeItems = (res: any): { arr: Entry[]; total?: number; count?: number } => {
    if (Array.isArray(res)) return { arr: res, total: undefined, count: res.length };
    return { arr: res?.items ?? [], total: res?.total, count: res?.count ?? (res?.items?.length ?? 0) };
  };

  const startPollingMood = (id: number) => {
    if (pollsRef.current.has(id)) return;
    const tick = async () => {
      const ps = pollsRef.current.get(id) ?? { attempts: 0 };
      const attempts = ps.attempts + 1;
      try {
        const updated = await getEntryById(id);
        if (updated?.mood != null) {
          setItems(prev => {
            const next = prev.map(it => (it.id === id ? { ...it, mood: updated.mood } : it));
            primeEntries(next);
            return next;
          });
          if (ps.handle) clearTimeout(ps.handle);
          pollsRef.current.delete(id);
          return;
        }
      } catch {}
      const delay = Math.min(1200 + (attempts - 1) * 800, 5000);
      if (attempts >= 12) { if (ps.handle) clearTimeout(ps.handle); pollsRef.current.delete(id); return; }
      const handle = setTimeout(tick, delay);
      pollsRef.current.set(id, { attempts, handle });
    };
    const handle = setTimeout(tick, 1200);
    pollsRef.current.set(id, { attempts: 0, handle });
  };

  const loadFirstPage = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await getEntries({ skip: 0, limit: PAGE_SIZE });
      const { arr, total, count } = normalizeItems(res);
      setItems(arr);
      primeEntries(arr);
      setSkip(arr.length);
      setHasMore(total != null ? arr.length < total : count === PAGE_SIZE);
      arr.forEach(e => { if (e.mood == null) startPollingMood(e.id); });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  useEffect(() => {
    const off = onEntryCreated((e) => {
      if (e && e.id) {
        setItems(prev => {
          const next = [e, ...prev];
          primeEntries(next);
          return next;
        });
        if (e.mood == null) startPollingMood(e.id);
      } else {
        loadFirstPage();
      }
    });
    return off;
  }, [loadFirstPage]);

  useEffect(() => {
    return () => {
      pollsRef.current.forEach(ps => { if (ps.handle) clearTimeout(ps.handle); });
      pollsRef.current.clear();
    };
  }, []);

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await getEntries({ skip, limit: PAGE_SIZE });
      const { arr, total, count } = normalizeItems(res);
      if (arr.length > 0) {
        setItems(prev => {
          const seen = new Set(prev.map(x => x.id));
          const merged = [...prev, ...arr.filter(x => !seen.has(x.id))];
          primeEntries(merged);
          return merged;
        });
        setSkip(prev => prev + arr.length);
        setHasMore(total != null ? skip + arr.length < total : count === PAGE_SIZE);
        arr.forEach(e => { if (e.mood == null) startPollingMood(e.id); });
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  const openDetail = (entry: Entry) => setSelected(entry);
  const closeDetail = () => setSelected(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <View style={[styles.c, { backgroundColor: theme.colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Entries</Text>
          <Pressable
            onPress={() => nav.navigate('NewEntry')}
            style={({ pressed }) => [
              styles.addBtn,
              {
                opacity: pressed ? 0.85 : 1,
                backgroundColor: theme.colors.primary,
              },
            ]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Add new entry"
          >
            <Ionicons name="add" size={28} color={theme.colors.primaryOn} />
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          renderItem={({ item }) => <EntryCard item={item} onPress={() => openDetail(item)} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadFirstPage}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{ paddingVertical: spacing(1) }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      </View>

      {/* Modale dettaglio */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
          <View style={[styles.modalWrap, { backgroundColor: theme.colors.bg }]}>
            {selected && <EntryDetailView entry={selected} />}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  c: { flex: 1, paddingHorizontal: spacing(2) },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing(1),
    paddingBottom: spacing(1),
    paddingRight: spacing(1.5),
  },
  title: { ...fonts.title },

  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },

  footer: { paddingVertical: spacing(2), alignItems: 'center', justifyContent: 'center' },

  modalSafe: { flex: 1 },
  modalWrap: { flex: 1, padding: spacing(2), gap: spacing(1) },
});