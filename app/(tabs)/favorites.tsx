import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StopRow } from '@/components/stop-row';
import { ThemedText } from '@/components/themed-text';
import { useStopStore } from '@/store/stops';

export default function FavoritesScreen() {
  const router = useRouter();
  const favorites = useStopStore((s) => s.favorites);
  const removeFavorite = useStopStore((s) => s.removeFavorite);
  const selectStop = useStopStore((s) => s.selectStop);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.extId}
        renderItem={({ item }) => (
          <StopRow
            stop={{ id: item.id, extId: item.extId, name: item.name }}
            favorite
            onPress={() => {
              selectStop(item.extId);
              router.navigate('/');
            }}
            onToggleFavorite={() => removeFavorite(item.extId)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <ThemedText type="subtitle">No favorites yet</ThemedText>
            <ThemedText style={styles.hint}>
              Tap the star on a stop in Search to save it here.
            </ThemedText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  hint: { opacity: 0.6, textAlign: 'center' },
});
