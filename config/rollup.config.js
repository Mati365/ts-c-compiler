/* eslint-disable import/no-default-export */
import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import serve from 'rollup-plugin-serve';
import del from 'rollup-plugin-delete';
import postcss from 'rollup-plugin-postcss';
import {eslint} from 'rollup-plugin-eslint';
import {terser} from 'rollup-plugin-terser';

const devBuild = process.env.NODE_ENV === 'development';

const createBaseRollupConfig = (
  {
    dir,
    name,
    globals,
    serveFiles,
    compilerOptions,
  },
) => {
  let plugins = [
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
            declaration: true,
            declarationDir: path.resolve(dir, 'dist/typings/'),
            paths: {},
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
            contentBase: [
              'packages',
              'assets',
            ],
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
    input: path.resolve(dir, 'src/index.ts'),
    external: Object.keys(globals),
    output: [
      {
        format: 'es',
        file: path.resolve(dir, 'dist/es/index.js'),
        name,
        globals,
      },
    ],
    plugins,
  };
};

const SHARED_GLOBALS = {
  ramda: 'R',
  react: 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes',
  classnames: 'classNames',
};

/** PACKAGES BUILD */
export default [
];
