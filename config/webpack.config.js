const path = require('path');

module.exports = {
  target: 'web',
  entry: path.resolve(__dirname, '../src/index.ts'),
  devServer: {
    port: 8080,
    contentBase: path.resolve(__dirname, '../assets/'),
  },
  module: {
    rules: [
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../dist/'),
  },
};
