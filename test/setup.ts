import { mock } from 'bun:test';

// `expo-constants` pulls in React Native internals that bun's test runtime
// cannot load, and client.ts reads it at module-evaluation time — so the mock
// must be registered here (bunfig.toml preload), not inside a test file.
mock.module('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        rejseplanenAccessId: 'test-access-id',
        rejseplanenBaseUrl: 'https://api.test.local/api',
      },
    },
  },
}));
