import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

/**
 * ESLint uses this flat configuration for JavaScript files in the project.
 * JSDoc rules are intentionally enabled so public framework code documents
 * its inputs, outputs, and scenario state for beginner-friendly maintenance.
 */
export default [
  {
    ignores: ['node_modules/**', 'reports/**', 'screenshots/**'],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
    },
  },
];
