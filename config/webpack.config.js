const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PRODUCTION_MODE = process.env.NODE_ENV !== 'development';

const rootResolve = pkgPath =>
  path.resolve(process.cwd(), path.join('./', pkgPath));

exports.createConfig = ({
  optimize,
  nodemon = {},
  target,
  entryName,
  mainFile,
  outputFile,
  outputPath = '',
  plugins = [],
}) => ({
  target,
  mode: optimize || PRODUCTION_MODE ? 'production' : 'development',
  watch: !PRODUCTION_MODE,
  devtool: 'source-map',
  entry: {
    [entryName]: rootResolve(mainFile),
  },
  output: {
    filename: outputFile,
    publicPath: '',
    path: rootResolve(path.join('./dist', outputPath || '')),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.asm$/i,
        use: 'raw-loader',
      },
      {
        test: /\.(bin|flp)/,
        use: 'arraybuffer-loader',
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(png|jpe?g|gif|ttf|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/',
              emitFile: true,
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          onlyCompileBundledFiles: true,
          configFile: path.resolve(__dirname, '../tsconfig.json'),
          compilerOptions: {
            module: 'esnext',
            moduleResolution: 'node',
            declaration: false,
            declarationMap: false,
          },
        },
      },
    ],
  },
  externals: target === 'node' ? [nodeExternals()] : [],
  node: {
    __dirname: false,
  },
  plugins: [
    ...(target === 'node'
      ? []
      : [
          new HtmlWebpackPlugin({
            title: 'Emulator',
          }),
        ]),
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      exclude: ['node_modules'],
    }),
    new CircularDependencyPlugin(),
    ...plugins,
    ...(nodemon?.enabled
      ? [
          new NodemonPlugin({
            watch: 'dist',
            ...nodemon.attrs,
          }),
        ]
      : []),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    ...(target !== 'node' && {
      fallback: {
        path: false,
        fs: false,
      },
    }),
  },
});
