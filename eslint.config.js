// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Last so it disables any stylistic rules that would fight Prettier.
  prettierConfig,
  {
    // Type-aware rules that catch real async bugs (unawaited promises, async
    // handlers passed where sync is expected). Scoped to the logic layers —
    // running the type checker repo-wide would slow linting for little gain.
    files: ['services/**/*.ts', 'hooks/**/*.ts', 'store/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
