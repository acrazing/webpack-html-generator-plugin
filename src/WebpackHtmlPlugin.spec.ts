/*!
 *
 * Copyright 2016 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2016-11-11 16:00:58
 * @version 1.0.0
 * @desc WebpackHtmlPlugin.spec.ts
 */


import webpack = require('webpack')
import { resolve } from 'path'
import { WebpackHtmlPlugin } from './WebpackHtmlPlugin'
const ExtractTextPlugin: any = require('extract-text-webpack-plugin')

const compiler = webpack({
  entry  : {
    one: resolve(__dirname, '../__mock__/one'),
    two: resolve(__dirname, '../__mock__/two'),
  },
  output : {
    filename     : '[name].[chunkhash].js',
    path         : resolve(__dirname, '../dist'),
    chunkFilename: 'chunk.[name].[chunkhash].js',
    publicPath   : '/',
  },
  resolve: { extensions: ['', '.ts', '.js'] },
  module : {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.css$/, loader: ExtractTextPlugin.extract('css-loader') },
    ],
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(false),
    new webpack.optimize.CommonsChunkPlugin({
      name    : 'vendor',
      filename: '[name].[chunkhash].js',
    }),
    new WebpackHtmlPlugin(),
    new ExtractTextPlugin('[name].[contenthash].css', {
      disable  : false,
      allChunks: true,
    }),
  ],
})

compiler.watch({}, (error, stats) => {
  console.log(stats.toString())
})