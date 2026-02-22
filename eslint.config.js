import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        Reveal: 'readonly',
      },
    },
    rules: {
      // — Errors —
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',

      // — Warnings (clean up incrementally) —
      'no-console': 'off', // keep for now, lots of debug logging
      'prefer-const': 'warn',
      'no-var': 'warn',
      eqeqeq: ['warn', 'always'],
      curly: ['warn', 'multi-line'],

      // — Style (handled by Prettier, so off) —
      semi: 'off',
      quotes: 'off',
      indent: 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'plugin/**',
      'node_modules/**',
      '*.min.js',
    ],
  },
];
