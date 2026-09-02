// @ts-check
import eslintVue from 'eslint-plugin-vue';
import tseslint from '@vue/eslint-config-typescript';

export default tseslint({
  files: ['**/*.{ts,vue}'],
  extends: [
    eslintVue.configs['flat/recommended'],
  ],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
  },
}, {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@infrastructure/*'], message: 'Infrastructure must not be imported into UI/components/modules/composables. Depend on application ports instead.' },
        ],
      },
    ],
  },
}).override('src/infrastructure/**/*', {
  rules: { 'no-restricted-imports': 'off' },
}).override('src/application/**/*', {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['@infrastructure/*'], message: 'Application must not import infrastructure directly. Wire ports in app/providers.' },
        ],
      },
    ],
  },
});