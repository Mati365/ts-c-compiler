const {resolve} = require('path');
const {pathsToModuleNameMapper} = require('ts-jest/utils');

const {compilerOptions} = require('../tsconfig.json');

const SHARED_CONFIG = {
  moduleNameMapper: pathsToModuleNameMapper(
    compilerOptions.paths,
    {
      prefix: `${resolve(__dirname, '../packages')}/`,
    },
  ),
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules',
    '<rootDir>/dist/*',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

module.exports = {
  projects: [
    {
      displayName: 'adretail-ads',
      rootDir: resolve(__dirname, '../packages/adretail-ads/'),
      ...SHARED_CONFIG,
    },

    {
      displayName: 'adretail-react-ads',
      rootDir: resolve(__dirname, '../packages/adretail-react-ads/'),
      ...SHARED_CONFIG,
    },
  ],
};
