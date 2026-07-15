import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StopLocation } from '@/services/rejseplanen/types';

/**
 * Persisted app state: favorite stops and the currently selected stop.
 * Kept minimal and framework-agnostic so a future Wear OS bridge can read
 * "the selected stop / favorites" without pulling in UI code.
 */

/** Only the stop fields we need to persist and re-query. */
export type SavedStop = Pick<StopLocation, 'id' | 'extId' | 'name'>;

interface StopState {
  favorites: SavedStop[];
  selectedExtId: string | null;
  addFavorite: (stop: SavedStop) => void;
  removeFavorite: (extId: string) => void;
  isFavorite: (extId: string) => boolean;
  selectStop: (extId: string) => void;
}

export const useStopStore = create<StopState>()(
  persist(
    (set, get) => ({
      favorites: [],
      selectedExtId: null,
      addFavorite: (stop) =>
        set((s) =>
          s.favorites.some((f) => f.extId === stop.extId)
            ? s
            : { favorites: [...s.favorites, stop] },
        ),
      removeFavorite: (extId) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.extId !== extId) })),
      isFavorite: (extId) => get().favorites.some((f) => f.extId === extId),
      selectStop: (extId) => set({ selectedExtId: extId }),
    }),
    {
      name: 'next-train-stops',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
