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
  nodemon,
  target,
  entryName,
  mainFile,
  outputFile,
  outputPath = '',
  plugins = [],
}) => ({
  target,
  mode: PRODUCTION_MODE ? 'production' : 'development',
  watch: !PRODUCTION_MODE,
  devtool: PRODUCTION_MODE ? 'cheap-source-map' : 'eval-source-map',
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
        test: /\.asm$/i,
        use: 'raw-loader',
      },
      {
        test: /\.(bin|flp)/,
        use: 'arraybuffer-loader',
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
    ...(nodemon
      ? [
          new NodemonPlugin({
            watch: 'dist',
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
