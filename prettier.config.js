module.exports = {
  tabWidth: 2,
  singleQuote: true,
  printWidth: 90,
  trailingComma: 'all',
  arrowParens: 'avoid',
  customAttributes: ['className'],
  endingPosition: 'absolute',
  customFunctions: ['clsx'],
  plugins: [
    'prettier-plugin-tailwindcss',
    'prettier-plugin-classnames',
    'prettier-plugin-merge',
  ],
};
