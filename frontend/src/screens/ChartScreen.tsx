import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { VictoryChart, VictoryLine, VictoryScatter, VictoryTheme } from 'victory-native';
import { getEntries } from '../api/client';
import { Entry } from '../api/types';
import { theme, spacing } from '../theme';

export default function ChartScreen() {
  const [points, setPoints] = useState<{x: Date, y: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const rows: Entry[] = await getEntries();
    const pts = rows.filter(r => r.mood !== null).reverse().map(r => ({ x: new Date(r.created_at), y: r.mood as number }));
    setPoints(pts); setLoading(false);
  })(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator/></View>;

  return (
    <View style={styles.c}>
      <VictoryChart theme={VictoryTheme.material} domain={{ y: [0, 10] }}>
        <VictoryLine data={points} />
        <VictoryScatter data={points} size={3} />
      </VictoryChart>
    </View>
  );
}
const styles = StyleSheet.create({
  c:{ flex:1, backgroundColor: theme.bg, padding: spacing(2) },
  center:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: theme.bg }
});