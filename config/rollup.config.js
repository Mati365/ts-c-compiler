/* eslint-disable import/no-default-export */
import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import serve from 'rollup-plugin-serve';
import del from 'rollup-plugin-delete';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import {eslint} from 'rollup-plugin-eslint';
import {terser} from 'rollup-plugin-terser';

const devBuild = process.env.NODE_ENV === 'development';

const createBaseRollupConfig = (
  {
    dir,
    serveFiles,
    compilerOptions,
  },
) => {
  let plugins = [
    resolve(),
    del(
      {
        targets: [
          path.resolve(dir, 'dist/*'),
        ],
      },
    ),
    postcss(
      {
        plugins: [],
      },
    ),
    eslint(
      {
        configFile: './.eslintrc.yml',
        exclude: [
          'node_modules/**',
          '**/*.scss',
        ],
      },
    ),
    typescript(
      {
        clean: true,
        check: true,
        abortOnError: false,
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            target: 'es5',
            ...compilerOptions,
          },
        },
      },
    ),
  ];

  if (devBuild) {
    if (serveFiles) {
      plugins = [
        ...plugins,
        serve(
          {
            contentBase: ['assets', 'dist'],
          },
        ),
      ];
    }
  } else {
    plugins = [
      ...plugins,
      terser(),
    ];
  }

  return {
    input: path.resolve(dir, 'src/ts/index.ts'),
    output: [
      {
        format: 'umd',
        file: path.resolve(dir, 'dist/umd/index.js'),
      },
    ],
    plugins,
  };
};

/** PACKAGES BUILD */
export default createBaseRollupConfig(
  {
    dir: '.',
    serveFiles: true,
  },
);
