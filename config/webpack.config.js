const path = require('path');
const nodeExternals = require('webpack-node-externals');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');

const PRODUCTION_MODE = process.env.NODE_ENV === 'production';

const pkgResolve = (pkgPath) => path.resolve(__dirname, path.join('../packages/', pkgPath));
const srcResolve = (pkgPath) => path.resolve(__dirname, path.join('../src/', pkgPath));

const createConfig = (
  {
    nodemon,
    target,
    entryName,
    mainFile,
    outputFile,
    outputCssFile,
    outputPath = '',
    plugins = [],
  },
) => ({
  target,
  mode: PRODUCTION_MODE ? 'production' : 'development',
  watch: !PRODUCTION_MODE,
  devtool: 'source-map',
  entry: {
    [entryName]: srcResolve(mainFile),
  },
  output: {
    filename: outputFile,
    publicPath: 'public/',
    path: path.resolve(__dirname, '../dist', outputPath || ''),
  },
  module: {
    rules: [
      {
        test: /\.asm$/i,
        use: 'raw-loader',
      },
      {
        test: /\.(bin|flp)/,
        use: 'arraybuffer-loader',
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|ttf|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: 'public',
              emitFile: true,
            },
          },
        ],
      },
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          emitError: false,
        },
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          onlyCompileBundledFiles: true,
          configFile: path.resolve(__dirname, '../tsconfig.json'),
        },
      },
    ],
  },
  externals: (
    target === 'node'
      ? [
        nodeExternals(),
      ]
      : []
  ),
  node: {
    __dirname: false,
  },
  plugins: [
    new MiniCssExtractPlugin(
      {
        filename: outputCssFile,
        chunkFilename: '[id].css',
      },
    ),
    ...plugins,
    ...(
      nodemon
        ? [
          new NodemonPlugin(
            {
              watch: 'dist',
            },
          ),
        ]
        : []
    ),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@compiler/core': pkgResolve('compiler-core/src/'),
      '@compiler/lexer': pkgResolve('compiler-lexer/src/'),
      '@compiler/grammar': pkgResolve('compiler-grammar/src/'),
      '@compiler/rpn': pkgResolve('compiler-rpn/src/'),
      '@compiler/x86-assembler': pkgResolve('compiler-x86-assembler/src/'),
      '@compiler/x86-nano-c': pkgResolve('compiler-x86-nano-c/src'),
      '@emulator/x86-cpu': pkgResolve('emulator-x86-cpu/src'),
      '@ui/context-state': pkgResolve('ui-context-state/src'),
      '@ui/webapp': pkgResolve('ui-webapp/src'),
      '@client': srcResolve('client'),
      '@server': srcResolve('server'),
    },
  },
});

module.exports = [
  createConfig(
    {
      target: 'web',
      entryName: 'client',
      mainFile: 'client/index.tsx',
      outputPath: 'public',
      outputFile: `client${PRODUCTION_MODE ? '-[hash]' : ''}.js`,
      outputCssFile: `client${PRODUCTION_MODE ? '-[hash]' : ''}.css`,
      plugins: [
        new ManifestPlugin,
      ],
    },
  ),
  createConfig(
    {
      target: 'node',
      entryName: 'server',
      mainFile: 'server/main.ts',
      outputFile: 'server.js',
      nodemon: true,
    },
  ),
];
