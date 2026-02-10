import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/android/**', '**/ios/**'],
  },
  // Vue + TypeScript files
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      vue: eslintPluginVue,
      '@typescript-eslint': tsEslint,
    },
    rules: {
      // Frankenstein code prevention
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TypeScript anti-pattern prevention
      'eqeqeq': ['error', 'always'],                          // prevent == gotchas ([] == false is true!)
      '@typescript-eslint/no-explicit-any': 'warn',            // prevent lazy typing
      '@typescript-eslint/no-non-null-assertion': 'warn',      // prevent user!.name crash
      '@typescript-eslint/prefer-nullish-coalescing': 'off',   // needs type-checked config, enforce via code review

      // Vue consistency
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-mutating-props': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
    },
  },
  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TypeScript anti-pattern prevention
      'eqeqeq': ['error', 'always'],                          // prevent == gotchas
      '@typescript-eslint/no-explicit-any': 'warn',            // prevent lazy typing
      '@typescript-eslint/no-non-null-assertion': 'warn',      // prevent user!.name crash
      '@typescript-eslint/prefer-nullish-coalescing': 'off',   // needs type-checked config, enforce via code review
    },
  },
];

