module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unreachable': 2,
    '@typescript-eslint/no-require-imports': 2,
    eqeqeq: 2,
    // The following rules are added to minimize changeset
    // Reduce the following rules gradually
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    'no-prototype-builtins': 0,
    'no-var': 0,
    'no-useless-catch': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/ban-types': 0,
    'no-useless-escape': 0,
    '@typescript-eslint/prefer-as-const': 0,
  },
};
