const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const createConfig = require('./utils/createConfig');

module.exports = createConfig(
  {
    target: 'web',
    rootAppPath: path.resolve('./'),
    entry: {
      main: './src/terminal/window.jsx',
    },
    outputFolder: path.resolve(__dirname, '../dist'),
    outputFile: 'client-[hash].js',
    plugins: [
      new HtmlWebpackPlugin(
        {
          title: 'Emulator',
          template: 'src/terminal/template/window.ejs',
          filename: 'index.html',
        },
      ),
    ],
  },
);
