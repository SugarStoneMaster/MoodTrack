import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEntries } from '../api/client';
import type { Entry } from '../api/types';
import { useTheme, spacing, fonts } from '../theme';

type Pt = { x: Date; y: number };

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢', 2: '😟', 3: '😐', 4: '🙂', 5: '😄',
};

const PAD = { top: 16, right: 24, bottom: 36, left: 40 };
const H_MIN = 260;
const H_MAX = 520;

export default function ChartScreen() {
  const { theme } = useTheme();
  const [pts, setPts] = useState<Pt[]>([]);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEntries();
        const rows: Entry[] = Array.isArray(res) ? res : (res?.items ?? []);
        const data = rows
          .filter(r => r.mood != null)
          .map(r => ({ x: new Date(r.created_at), y: r.mood as number }))
          .sort((a, b) => +a.x - +b.x);
        setPts(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const layoutW = e.nativeEvent.layout.width;
    const layoutH = e.nativeEvent.layout.height;
    const H_PAD = spacing(2);
    setWidth(Math.max(0, layoutW - H_PAD * 2));
    setHeight(layoutH);
  };

  const chartH = Math.max(H_MIN, Math.min(H_MAX, height - spacing(6)));
  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = Math.max(chartH - PAD.top - PAD.bottom, 0);

  const hasData = pts.length > 0;
  const xMinNum = hasData ? +pts[0].x : Date.now();
  const xMaxNum = hasData ? +pts[pts.length - 1].x : xMinNum + 1;
  const xSpan = Math.max(xMaxNum - xMinNum, 1);

  const yMin = 1, yMax = 5;
  const ySpan = yMax - yMin;

  const mapX = (d: Date) => PAD.left + (innerW * (+d - xMinNum)) / xSpan;
  const mapY = (y: number) => PAD.top + innerH * (1 - (y - yMin) / ySpan);

  const polyPoints = pts.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' ');
  const yTicks = [1, 2, 3, 4, 5];
  const xTicksDates: Date[] = !hasData
    ? []
    : pts.length === 1
      ? [pts[0].x]
      : [
          new Date(xMinNum),
          new Date(xMinNum + xSpan / 3),
          new Date(xMinNum + (2 * xSpan) / 3),
          new Date(xMaxNum),
        ];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <Text style={[fonts.body, { color: theme.colors.text }]}>Nessun dato disponibile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <View style={[styles.c, { backgroundColor: theme.colors.bg }]} onLayout={onLayout}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Stats</Text>

        {width > 0 && (
          <Svg width={width} height={chartH}>
            {/* Griglia Y + etichette */}
            <G>
              {yTicks.map(t => {
                const y = mapY(t);
                return (
                  <G key={`y-${t}`}>
                    <Line
                      x1={PAD.left}
                      x2={width - PAD.right}
                      y1={y}
                      y2={y}
                      stroke={theme.colors.line}
                      strokeDasharray="4,4"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={PAD.left - 10}
                      y={y + 5}
                      textAnchor="end"
                      fontSize={16}
                      fill={theme.colors.text}
                    >
                      {MOOD_EMOJIS[t]}
                    </SvgText>
                  </G>
                );
              })}
            </G>

            {/* Asse X + etichette */}
            <G>
              <Line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={PAD.top + innerH}
                y2={PAD.top + innerH}
                stroke={theme.colors.line}
                strokeWidth={1}
              />
              {xTicksDates.map((d, i) => {
                const x = mapX(d);
                const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <G key={`x-${i}`}>
                    <Line
                      x1={x}
                      x2={x}
                      y1={PAD.top + innerH}
                      y2={PAD.top + innerH + 4}
                      stroke={theme.colors.line}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={x}
                      y={PAD.top + innerH + 18}
                      textAnchor="middle"
                      fontSize={10}
                      fill={theme.colors.text}
                    >
                      {label}
                    </SvgText>
                  </G>
                );
              })}
            </G>

            {/* Linea */}
            <Polyline
              points={polyPoints}
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth={2}
            />

            {/* Punti */}
            {pts.map((p, idx) => (
              <Circle
                key={idx}
                cx={mapX(p.x)}
                cy={mapY(p.y)}
                r={3.5}
                fill={theme.colors.primary}
              />
            ))}
          </Svg>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  c: { flex: 1, paddingHorizontal: spacing(2), paddingTop: spacing(2) },
  title: { ...fonts.title, marginBottom: spacing(1) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});