import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, Modal, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';

import { getEntries } from '../api/client';
import type { Entry } from '../api/types';
import EntryCard from '../components/EntryCard';
import { useTheme, spacing, fonts } from '../theme';
import { onEntryCreated } from '../lib/events';
import { EntryDetailView } from './EntryDetailScreen';
import { getCachedEntries, primeEntries } from '../lib/dataCache';

const PAGE_SIZE = 20;

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [all, setAll] = useState<Entry[]>(() => getCachedEntries() ?? []);
  const [selected, setSelected] = useState<string>(toDateKey(new Date()));
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const normalizeItems = (res: any): { arr: Entry[]; total?: number; count?: number } => {
    if (Array.isArray(res)) return { arr: res, total: undefined, count: res.length };
    return { arr: res?.items ?? [], total: res?.total, count: res?.count ?? (res?.items?.length ?? 0) };
  };

  const prefetchAll = useCallback(async () => {
    try {
      let skip = 0;
      const limit = PAGE_SIZE;
      const byId = new Map<number, Entry>();
      (getCachedEntries() ?? []).forEach(e => byId.set(e.id, e));
      while (true) {
        const res = await getEntries({ skip, limit });
        const { arr, count } = normalizeItems(res);
        if (arr.length === 0) break;
        arr.forEach(e => byId.set(e.id, e));
        skip += arr.length;
        if ((count ?? arr.length) < limit) break;
      }
      const merged = Array.from(byId.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAll(merged);
      primeEntries(merged);
    } catch {}
  }, []);

  useEffect(() => {
    if ((getCachedEntries() ?? []).length === 0) {
      (async () => {
        const res = await getEntries({ skip: 0, limit: PAGE_SIZE });
        const { arr } = normalizeItems(res);
        setAll(arr);
        primeEntries(arr);
        prefetchAll();
      })();
    } else {
      prefetchAll();
    }
  }, [prefetchAll]);

  useFocusEffect(useCallback(() => { prefetchAll(); }, [prefetchAll]));

  useEffect(() => {
    const off = onEntryCreated((e) => {
      if (e && e.id) {
        setAll(prev => {
          const seen = new Set(prev.map(x => x.id));
          const next = seen.has(e.id) ? prev : [e, ...prev];
          primeEntries(next);
          return next;
        });
      } else {
        prefetchAll();
      }
    });
    return off;
  }, [prefetchAll]);

  const dayItems = useMemo(
    () => all.filter(e => toDateKey(new Date(e.created_at)) === selected),
    [all, selected]
  );

  const marks = useMemo(() => {
    const obj: Record<string, any> = {};
    all.forEach(e => { const k = toDateKey(new Date(e.created_at)); obj[k] = { marked: true }; });
    obj[selected] = { ...(obj[selected] || {}), selected: true };
    return obj;
  }, [all, selected]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <View style={[styles.c, { backgroundColor: theme.colors.bg }]}>
        <View style={[styles.header]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Calendar</Text>
        </View>

        <Calendar
          markedDates={marks}
          onDayPress={(d) => setSelected(d.dateString)}
          theme={{
            calendarBackground: theme.colors.bg,
            dayTextColor: theme.colors.text,
            monthTextColor: theme.colors.text,
            textDisabledColor: theme.colors.subtext,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: theme.colors.primaryOn,
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
          }}
        />

        <FlatList
          data={dayItems}
          keyExtractor={(x) => String(x.id)}
          renderItem={({ item }) => (
            <EntryCard item={item} onPress={() => setSelectedEntry(item)} />
          )}
          contentContainerStyle={{ padding: spacing(2) }}
        />
      </View>

      <Modal
        visible={!!selectedEntry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
          <View style={[styles.modalWrap, { backgroundColor: theme.colors.bg }]}>
            {selectedEntry && <EntryDetailView entry={selectedEntry} />}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  c: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
    paddingBottom: spacing(1),
  },
  title: { ...fonts.title },

  modalSafe: { flex: 1 },
  modalWrap: { flex: 1, padding: spacing(2) },
});