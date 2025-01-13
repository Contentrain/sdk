// @ts-check
import antfu from '@antfu/eslint-config';

export default antfu({
  ignores: [
    'dist',
    '**/node_modules',
    'dist',
    'node_modules',
    '__mocks__',
    '**/*.md',
    '**/*.mdx',
    '**/*.markdown',
    '**/*.json',
  ],
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  vue: {
    overrides: {
      'vue/html-indent': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['error', {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      }],
    },
  },
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
    'import/order': 'off',
    'sort-imports': 'off',
  },
});
