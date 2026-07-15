import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StopRow } from '@/components/stop-row';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNearbyStops, useStopSearch } from '@/hooks/use-rejseplanen';
import type { StopLocation } from '@/services/rejseplanen/types';
import { useStopStore } from '@/store/stops';

export default function SearchScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';

  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const favorites = useStopStore((s) => s.favorites);
  const addFavorite = useStopStore((s) => s.addFavorite);
  const removeFavorite = useStopStore((s) => s.removeFavorite);
  const selectStop = useStopStore((s) => s.selectStop);

  // Debounce the text query to avoid hammering the API on each keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(id);
  }, [text]);

  const search = useStopSearch(debounced);
  const nearby = useNearbyStops(coords);

  // When searching by text, show search results; otherwise nearby stops.
  const showingSearch = debounced.trim().length >= 2;
  const active = showingSearch ? search : nearby;
  const stops: StopLocation[] = active.data ?? [];

  const isFav = (extId: string) => favorites.some((f) => f.extId === extId);

  const onSelect = (stop: StopLocation) => {
    selectStop(stop.extId);
    router.navigate('/');
  };

  const useMyLocation = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. You can still search by name.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setText('');
      setDebounced('');
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      setLocationError('Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={20} color={Colors[scheme].icon} />
        <TextInput
          style={[styles.input, { color: Colors[scheme].text }]}
          placeholder="Search stop or station…"
          placeholderTextColor={Colors[scheme].icon}
          value={text}
          onChangeText={setText}
          autoCorrect={false}
          returnKeyType="search"
        />
        {text ? (
          <Pressable hitSlop={10} onPress={() => setText('')}>
            <IconSymbol name="xmark" size={18} color={Colors[scheme].icon} />
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.locationBtn} onPress={useMyLocation}>
        <IconSymbol name="location.fill" size={18} color={Colors[scheme].tint} />
        <ThemedText style={{ color: Colors[scheme].tint }}>Use my location</ThemedText>
      </Pressable>

      {locationError ? (
        <ThemedText style={styles.error}>{locationError}</ThemedText>
      ) : null}

      {locating || active.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={stops}
          keyExtractor={(s) => s.extId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <StopRow
              stop={item}
              favorite={isFav(item.extId)}
              onPress={() => onSelect(item)}
              onToggleFavorite={() =>
                isFav(item.extId)
                  ? removeFavorite(item.extId)
                  : addFavorite({ id: item.id, extId: item.extId, name: item.name })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText style={styles.hint}>
                {showingSearch || coords
                  ? 'No stops found.'
                  : 'Search by name or use your location.'}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#8881',
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hint: { opacity: 0.6, textAlign: 'center' },
  error: { color: '#e0562d', paddingHorizontal: 16, paddingBottom: 8 },
});
