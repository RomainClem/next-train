import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DepartureRow } from '@/components/departure-row';
import { ThemedText } from '@/components/themed-text';
import { useDepartureBoard } from '@/hooks/use-rejseplanen';
import { useStopStore } from '@/store/stops';

export default function DeparturesScreen() {
  const selectedExtId = useStopStore((s) => s.selectedExtId);
  const favorites = useStopStore((s) => s.favorites);
  const selectedName = favorites.find((f) => f.extId === selectedExtId)?.name;

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useDepartureBoard(selectedExtId);

  // Tick so "minutes until" stays fresh between the 30s query refetches.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!selectedExtId) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ThemedText type="subtitle">No stop selected</ThemedText>
        <ThemedText style={styles.hint}>
          Pick a stop from the Search tab to see live departures.
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {selectedName ? (
        <ThemedText type="subtitle" style={styles.header}>
          {selectedName}
        </ThemedText>
      ) : null}

      {isError ? (
        <View style={styles.center}>
          <ThemedText style={styles.error}>
            {(error as Error)?.message ?? 'Failed to load departures.'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(d) => d.key}
          renderItem={({ item }) => <DepartureRow departure={item} now={now} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText style={styles.hint}>
                {isLoading ? 'Loading departures…' : 'No upcoming departures.'}
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  hint: { opacity: 0.6, textAlign: 'center' },
  error: { color: '#e0562d', textAlign: 'center' },
});
