import { useQuery } from '@tanstack/react-query';

import { departureBoardNormalised, nearbyStops, searchStops } from '@/services/rejseplanen/api';

/**
 * React Query hooks for Rejseplanen data. Query keys are namespaced so caches
 * don't collide; the departure board auto-refreshes to keep "minutes until"
 * live without hand-rolled timers.
 */

/** Live departure board for a stop. Polls every 30s while mounted. */
export function useDepartureBoard(extId: string | null) {
  return useQuery({
    queryKey: ['departureBoard', extId],
    queryFn: () => departureBoardNormalised(extId as string),
    enabled: !!extId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/** Debounced-friendly stop search. Only runs for queries of 2+ chars. */
export function useStopSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['stopSearch', trimmed],
    queryFn: () => searchStops(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}

/** Stops near a coordinate. Pass null coords to keep it disabled. */
export function useNearbyStops(coords: { lat: number; lon: number } | null) {
  return useQuery({
    queryKey: ['nearbyStops', coords?.lat, coords?.lon],
    queryFn: () => nearbyStops(coords!.lat, coords!.lon),
    enabled: !!coords,
    staleTime: 30_000,
  });
}
