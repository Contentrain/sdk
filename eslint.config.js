// @ts-check
import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  ignores: [
    'dist',
    '**/node_modules',
    '**/.git',
    '**/temp',
    'reference/**',
    '*.json',
  ],
  rules: {
    'no-console': 'off',
    'style/semi': ['error', 'always'],
    'style/quotes': ['error', 'single'],
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
  },
});
