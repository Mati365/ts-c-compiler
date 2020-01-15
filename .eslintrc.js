const {resolve} = require('path');

module.exports = {
  parser: 'babel-eslint',
  'extends': 'airbnb',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['import'],
  env: {
    browser: true,
    mocha: true,
  },
  rules: {
    'nonblock-statement-body-position': 0,
    'jsx-quotes': [
      'error',
      'prefer-single'
    ],
    'object-property-newline': 0,
    'prefer-destructuring': 0,
    'object-curly-spacing': [
      'error',
      'never'
    ],
    'react/no-unused-prop-types': 0,
    'class-methods-use-this': 0,
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-new': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/mouse-events-have-key-events': 0,
    'import/no-extraneous-dependencies': 0,
    'one-var': 0,
    'one-var-declaration-per-line': 0,
    'no-plusplus': 0,
    'no-console': 0,
    'no-underscore-dangle': 0,
    'react/prop-types': 0,
    'object-curly-newline': 0,
    'no-unused-expressions': 0,
    'react/forbid-prop-types': 0,
    'react/no-danger': 0,
    curly: 0,
    'new-parens': 0,
    'no-continue': 0,
    'no-param-reassign': 0,
    'no-bitwise': 0,
    'no-loop-func': 0,
    'guard-for-in': 0,
    'max-len': ["error", { "code": 180 }],
    'no-return-assign': ['error', 'except-parens'],
    'indent': [
      'error',
      2,
      {
        ignoredNodes: ['TemplateLiteral > *'],
        SwitchCase: 1
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: [
          'node_modules',
          resolve(__dirname, 'src'),
        ]
      },
      // webpack: {
      //   config: resolve(__dirname, 'config/webpack.config.js'),
      // }
    }
  }
};
