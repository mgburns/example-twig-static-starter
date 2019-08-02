// eslint-disable-next-line
const webpack = require('webpack');
const path = require('path');

/** @type {webpack.Configuration} */
module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    main: './src/js/main.js',
    examples: './src/js/examples.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist/js'),
    publicPath: '/',
    filename: '[name].js',
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'inline-source-map',
};
