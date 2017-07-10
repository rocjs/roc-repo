module.exports = {
  extends: [
    require.resolve('eslint-config-airbnb-base'),
    require.resolve('eslint-config-roc'),
    require.resolve('eslint-config-prettier'),
  ],

  parser: require.resolve('babel-eslint'),

  plugins: ['prettier', 'eslint-plugin-babel'],

  rules: {
    'no-underscore-dangle': 'off',
    'no-use-before-define': ['error', { functions: false }],
    'global-require': 'off',

    'prettier/prettier': ['error', { trailingComma: 'all', singleQuote: true }],

    'import/no-dynamic-require': 'off',
  },
};
