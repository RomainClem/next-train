# next-train

A React Native (Expo, Bun) app that shows live departures ("next train") for stops in
Denmark, using the [Rejseplanen Labs API 2.0](https://labs.rejseplanen.dk) (HAFAS ReST).

Search stops by name or GPS, save favorites, and watch live departure times count down.
A native **Wear OS** companion (Data Layer sync) is planned for a later phase.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```
2. Add your API key. Register at [labs.rejseplanen.dk](https://labs.rejseplanen.dk), then:
   ```bash
   cp .env.example .env
   # edit .env and set REJSEPLANEN_ACCESS_ID
   ```
3. Start the app:
   ```bash
   bun run start        # then press 'a' for Android, 'w' for web
   ```

## Sanity-check the API key

```bash
curl "https://www.rejseplanen.dk/api/location.name?input=Odense&format=json&accessId=$REJSEPLANEN_ACCESS_ID"
```

## Project structure

- `app/(tabs)/` — screens: `index` (Departures), `search`, `favorites` (expo-router).
- `services/rejseplanen/` — framework-agnostic API client (`client`, `api`, `types`).
- `hooks/use-rejseplanen.ts` — React Query hooks (departure board auto-refreshes every 30s).
- `store/stops.ts` — zustand store (favorites + selected stop) persisted via AsyncStorage.

## Notes

- **Web target**: the HAFAS API may not send CORS headers, so browser `fetch` can fail.
  If so, front it with an Expo Router API route or a small proxy that injects `accessId`.
- **Wear OS** (future): requires `expo prebuild` + a native Kotlin/Compose watch module using
  the Wearable Data Layer, bridged with `react-native-wear-connectivity`. Not in Expo Go.
