import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';

export const createPackageRollupConfig = () => ({
  input: 'src/index.ts',
  external: [/(node_modules|@ts-cc)/],
  cache: false,
  output: [
    {
      file: './dist/cjs/index.js',
      format: 'cjs',
    },
    {
      file: './dist/esm/index.js',
      format: 'esm',
    },
  ],
  plugins: [
    typescript({
      sourceMap: true,
      inlineSources: true,
      inlineSourceMap: true,
      tsconfig: './tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          module: 'ES2022',
          moduleResolution: 'node',
          declaration: true,
        },
        include: ['src/'],
        exclude: ['node_modules/', '**/*.test.tsx', '**/*.test.ts'],
      },
    }),
    resolve({
      moduleDirectories: ['node_modules'],
      preferBuiltins: true,
    }),
  ],
});
