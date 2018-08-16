// Copyright (c) 2018 Zilliqa
// This source code is being disclosed to you solely for the purpose of your participation in
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to
// the protocols and algorithms that are programmed into, and intended by, the code. You may
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd.,
// including modifying or publishing the code (or any part of it), and developing or forming
// another public or private blockchain network. This source code is provided ‘as is’ and no
// warranties are given as to title or non-infringement, merchantability or fitness for purpose
// and, to the extent permitted by law, all liability for your use of the code is disclaimed.
// Base webpack configuration - to be used in ALL environments.
/* eslint import/no-extraneous-dependencies: ["error", { devDependencies: true }] */
const path = require('path');
const webpack = require('webpack');
const UglifyJs = require('uglifyjs-webpack-plugin');

const baseConfig = {
  entry: {
    zilliqa: [
      'whatwg-fetch',
      './src/index.ts'
    ],
  },
  mode: 'production',
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
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

const clientConfig = {
  ...baseConfig,
  optimization: {
    minimizer: [
      new UglifyJs({
        uglifyOptions: {
          compress: true,
          mangle: true,
          toplevel: false,
          output: {
            beautify: false,
            comments: false,
          },
        },
        include: /zilliqa\.js$/,
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
  output: {
    libraryTarget: 'umd',
    library: 'zilliqa.js',
    filename: '[name].browser.js',
    path: path.join(__dirname, 'dist'),
  },
}

const serverConfig = {
  ...baseConfig,
  target: 'node',
  output: {
    filename: '[name].server.js',
    library: 'zilliqa.js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'dist'),
  }
}

module.exports = [baseConfig, serverConfig];
