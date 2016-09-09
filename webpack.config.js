const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/terminal/window.jsx',
  output: {
    path: __dirname,
    filename: 'dist/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0', 'react'],
          plugins: ['transform-decorators-legacy']
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'x86 terminal',
      filename: 'dist/window.html'
    })
  ]
};
