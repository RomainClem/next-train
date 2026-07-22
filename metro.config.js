// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand v5's ESM build (node_modules/zustand/esm/*.mjs) uses Vite-style
// `import.meta.env.MODE`. With package-exports resolution (default in SDK 54)
// Metro picks that ESM build and emits `import.meta` verbatim into the web
// bundle. Because Expo's web bundle loads as a classic <script> (not a module),
// the browser throws "Cannot use 'import.meta' outside a module", which aborts
// the script before React can hydrate — the page renders (static HTML) but is
// completely inert. Forcing zustand to its CommonJS build (which guards on
// `process.env` instead) fixes it, scoped to zustand alone.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return resolve({ ...context, unstable_enablePackageExports: false }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
