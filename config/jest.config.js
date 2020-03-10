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
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  projects: [
    {
      displayName: '@compiler/rpn',
      rootDir: resolve(__dirname, '../packages/compiler-rpn/'),
      ...SHARED_CONFIG,
    },
    {
      displayName: '@compiler/x86-assembler',
      rootDir: resolve(__dirname, '../packages/compiler-x86-assembler/'),
      ...SHARED_CONFIG,
    },
  ],
};
