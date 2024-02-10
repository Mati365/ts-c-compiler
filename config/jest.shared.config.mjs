import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { pathsToModuleNameMapper } from 'ts-jest';

export const createJestConfig = ({ rootDir }) => {
  const { compilerOptions } = JSON.parse(readFileSync(resolve(rootDir, 'tsconfig.json')));

  return {
    rootDir,
    preset: 'ts-jest/presets/default-esm',
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
      prefix: resolve(rootDir, compilerOptions.baseUrl),
    }),
    resetMocks: true,
    testPathIgnorePatterns: ['node_modules'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleDirectories: ['node_modules', 'src'],
    testEnvironment: 'node',
    testRegex: '.test\\.ts$',
    transform: {
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          useESM: true,
          tsconfig: {
            ...compilerOptions,
            module: 'EsNext',
            moduleResolution: 'NodeNext',
            declaration: false,
            declarationMap: false,
          },
        },
      ],
      '\\.asm$': resolve(
        fileURLToPath(import.meta.url),
        '../jest-extensions/file-transformer.js',
      ),
    },
  };
};
