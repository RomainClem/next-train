import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { NormalisedDeparture } from '@/services/rejseplanen/types';

/** Minutes from now until `when`, floored (negative shown as 0 / "now"). */
function minutesUntil(when: Date, now: number): number {
  return Math.max(0, Math.round((when.getTime() - now) / 60000));
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function DepartureRow({
  departure,
  now,
}: {
  departure: NormalisedDeparture;
  now: number;
}) {
  const mins = minutesUntil(departure.when, now);
  const delayed = departure.delayMinutes > 0;

  return (
    <View testID="departure-row" style={styles.row}>
      <View style={styles.left}>
        <ThemedText type="defaultSemiBold">{departure.name}</ThemedText>
        <ThemedText numberOfLines={1} style={styles.direction}>
          {departure.direction || '—'}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {hhmm(departure.when)}
          {departure.track ? `  ·  Plat. ${departure.track}` : ''}
          {delayed ? `  ·  +${departure.delayMinutes} min` : ''}
        </ThemedText>
      </View>
      <View style={styles.right}>
        {departure.cancelled ? (
          <ThemedText style={styles.cancelled}>Cancelled</ThemedText>
        ) : (
          <ThemedText type="title" style={[styles.mins, delayed && styles.minsDelayed]}>
            {mins === 0 ? 'now' : `${mins}′`}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
    gap: 12,
  },
  left: { flex: 1, gap: 2 },
  right: { minWidth: 64, alignItems: 'flex-end' },
  direction: { fontSize: 15, opacity: 0.9 },
  meta: { fontSize: 13, opacity: 0.6 },
  mins: { fontSize: 26, lineHeight: 30 },
  minsDelayed: { color: '#e0562d' },
  cancelled: { color: '#e0562d', fontWeight: '600' },
});
