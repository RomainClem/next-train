import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { StopLocation } from '@/services/rejseplanen/types';

export function StopRow({
  stop,
  favorite,
  onPress,
  onToggleFavorite,
}: {
  stop: StopLocation;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  return (
    <Pressable testID={`stop-${stop.extId}`} style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {stop.name}
        </ThemedText>
        {stop.dist !== undefined ? (
          <ThemedText style={styles.meta}>{Math.round(stop.dist)} m away</ThemedText>
        ) : null}
      </View>
      <Pressable
        testID={`fav-${stop.extId}`}
        hitSlop={12}
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityLabel={favorite ? 'Remove favorite' : 'Add favorite'}>
        <IconSymbol name={favorite ? 'star.fill' : 'star'} size={24} color={tint} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
    gap: 12,
  },
  left: { flex: 1, gap: 2 },
  meta: { fontSize: 13, opacity: 0.6 },
});
