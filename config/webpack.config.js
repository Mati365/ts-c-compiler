const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const pkgResolve = (pkgPath) => path.resolve(__dirname, path.join('../packages/', pkgPath));
const srcResolve = (pkgPath) => path.resolve(__dirname, path.join('../src/', pkgPath));

module.exports = {
  target: 'web',
  entry: srcResolve('client/index.tsx'),
  devtool: 'source-map',
  devServer: {
    port: 8080,
    contentBase: path.resolve(__dirname, '../assets/'),
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
  plugins: [
    new MiniCssExtractPlugin(
      {
        filename: 'bundle.css',
        chunkFilename: '[id].css',
      },
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
      '@ui/webapp-scss': pkgResolve('ui-webapp-scss/src'),
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../dist/'),
  },
};
