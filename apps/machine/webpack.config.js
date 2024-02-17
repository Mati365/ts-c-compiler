const webpack = require('webpack');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const { createConfig } = require('../../config/webpack.config');

module.exports = [
  createConfig({
    target: 'node',
    entryName: 'server',
    mainFile: 'src/server/index.ts',
    outputFile: 'server.js',
    outputPath: 'bin',
    configDir: __dirname,
    nodemon: {
      enabled: true,
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true,
      }),
    ],
  }),

  createConfig({
    target: 'web',
    entryName: 'client',
    mainFile: 'src/client/index.ts',
    outputFile: 'client-[contenthash].js',
    outputPath: 'bin/client',
    configDir: __dirname,
    plugins: [
      new WebpackManifestPlugin({
        fileName: 'manifest.json',
      }),
    ],
  }),
];
