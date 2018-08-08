// Base webpack configuration - to be used in ALL environments.
/* eslint import/no-extraneous-dependencies: ["error", { devDependencies: true }] */
const path = require('path');
const webpack = require('webpack');

const baseConfig = {
  entry: {
    zilliqa: './src/index.ts',
    'zilliqa.min': './src/index.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true,
            cacheDirectory: true,
          },
        },
      },
    ],
  },
  output: {
    libraryTarget: 'umd',
    library: 'zilliqa.js',
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

module.exports = baseConfig;
