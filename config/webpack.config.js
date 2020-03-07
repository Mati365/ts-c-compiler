const path = require('path');

const pkgResolve = (pkgPath) => path.resolve(__dirname, path.join('../packages/', pkgPath));

module.exports = {
  target: 'web',
  entry: pkgResolve('emulator-ui/src/main.ts'),
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
    alias: {
      '@compiler/core': pkgResolve('compiler-core/src/'),
      '@compiler/lexer': pkgResolve('compiler-lexer/src/'),
      '@compiler/rpn': pkgResolve('compiler-rpn/src/'),
      '@compiler/x86-assembler': pkgResolve('compiler-x86-assembler/src/'),
      '@emulator/ui': pkgResolve('emulator-ui/src/'),
      '@emulator/x86-cpu': pkgResolve('emulator-x86-cpu/src'),
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../dist/'),
  },
};
