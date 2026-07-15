import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config. Expo passes the resolved `app.json` as `config`; we
 * extend it so we can read secrets (the Rejseplanen API 2.0 `accessId`) from
 * the environment at build/start time and surface them via `expoConfig.extra`.
 *
 * Set REJSEPLANEN_ACCESS_ID in a git-ignored `.env` (see `.env.example`).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'next-train-bun',
  slug: config.slug ?? 'next-train-bun',
  plugins: [...(config.plugins ?? []), 'expo-location'],
  extra: {
    ...config.extra,
    rejseplanenAccessId: process.env.REJSEPLANEN_ACCESS_ID ?? '',
    // Host your key is provisioned for. Verify with the curl in the plan.
    rejseplanenBaseUrl:
      process.env.REJSEPLANEN_BASE_URL ?? 'https://www.rejseplanen.dk/api',
  },
});
