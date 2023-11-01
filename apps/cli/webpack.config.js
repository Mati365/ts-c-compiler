const webpack = require('webpack');
const { createConfig } = require('../../config/webpack.config');

module.exports = createConfig({
  target: 'node',
  entryName: 'cli',
  mainFile: 'src/index.ts',
  outputFile: 'bin/cli.js',
  nodemon: {
    enabled: true,
    attrs: {
      args: ['./.mock/main.c', '-d'],
    },
  },
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
  ],
});
