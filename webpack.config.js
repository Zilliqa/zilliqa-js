// Base webpack configuration - to be used in ALL environments.
/* eslint import/no-extraneous-dependencies: ["error", { devDependencies: true }] */
const path = require('path');
const webpack = require('webpack');
const UglifyJs = require('uglifyjs-webpack-plugin');

const baseConfig = {
  entry: {
    zilliqa: './src/index.ts',
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
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

module.exports = baseConfig;
