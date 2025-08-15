import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { getEntries } from '../api/client';
import EntryCard from '../components/EntryCard';
import { Entry } from '../api/types';
import { theme, spacing } from '../theme';

export default function EntriesScreen() {
  const [data, setData] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setData(await getEntries()); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.c}>
      <FlatList
        data={data}
        keyExtractor={(x) => String(x.id)}
        renderItem={({item}) => <EntryCard item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ paddingVertical: spacing(1) }}
      />
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, backgroundColor: theme.bg, paddingHorizontal: spacing(2) }});