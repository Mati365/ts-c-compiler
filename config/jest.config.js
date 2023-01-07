const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig.json');

const SHARED_CONFIG = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: `${resolve(__dirname, '../packages')}/`,
  }),
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist/*'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [],
  transform: {
    '^.+\\.(jsx?|tsx?)$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: 'typescript',
            jsx: true,
            tsx: true,
            dynamicImport: false,
            privateMethod: false,
            functionBind: false,
            exportDefaultFrom: true,
            exportNamespaceFrom: false,
            decorators: true,
            decoratorsBeforeExport: true,
            topLevelAwait: false,
            importMeta: false,
          },
          transform: null,
          target: 'es2020',
          loose: false,
          externalHelpers: false,
          keepClassNames: false,
        },
      },
    ],
    '\\.asm$': 'jest-raw-loader',
  },
};

module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },
  projects: [
    {
      displayName: '@compiler/rpn',
      rootDir: resolve(__dirname, '../packages/compiler-rpn/'),
      ...SHARED_CONFIG,
    },
    {
      displayName: '@compiler/pico-c',
      rootDir: resolve(__dirname, '../packages/compiler-pico-c/'),
      ...SHARED_CONFIG,
    },
    {
      displayName: '@x86-toolkit/assembler',
      rootDir: resolve(__dirname, '../packages/x86-toolkit/x86-assembler/'),
      ...SHARED_CONFIG,
    },
  ],
};
