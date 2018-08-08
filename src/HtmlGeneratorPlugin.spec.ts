/*!
 *
 * Copyright 2016 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2016-11-11 16:00:58
 * @version 1.0.0
 * @desc WebpackHtmlPlugin.spec.ts
 */

import { readdirSync } from 'fs';
import { SMap } from 'monofile-utilities/lib/map';
import { basename, resolve } from 'path';
import webpack from 'webpack';
import { HtmlGeneratorPlugin } from './HtmlGeneratorPlugin';
import CleanCSS = require('clean-css');
import postcss = require('postcss');

const autoprefixer: any = require('autoprefixer');

const MiniCssExtractPlugin: any = require('mini-css-extract-plugin');
const prefixer = autoprefixer({
  browsers: [
    'Chrome >= 4',
    'Firefox >= 2',
    'ie >= 10',
    'iOS >= 6',
    'Opera >= 10',
    'Safari >= 6',
    'Android >= 4',
    'UCAndroid >= 11',
  ],
});

const ENTRIES = readdirSync(resolve(__dirname, '../__mock__'))
  .filter((item) => item.endsWith('.ts') && item !== 'common.ts')
  .map((item) => basename(item, '.ts'))
  .reduce((prev, name) => {
    prev[name] = [resolve(__dirname, `../__mock__/${name}`)];
    return prev;
  }, {} as SMap<string[]>);

const compiler = webpack({
  mode: 'development',
  entry: {
    ...ENTRIES,
  },
  output: {
    filename: '[name].[chunkhash].js',
    path: resolve(__dirname, '../dist'),
    chunkFilename: 'chunk.[name].[chunkhash].js',
    publicPath: '/',
  },
  resolve: { extensions: ['.ts', '.js', '.json'] },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' },
      {
        test: /\.css$/, use: [
          { loader: MiniCssExtractPlugin.loader, options: { sourceMap: true } },
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins: [
                require('postcss-import')(),
                prefixer,
                require('cssnano')({
                  preset: [
                    'default',
                    {
                      discardComments: { removeAll: true },
                    },
                  ],
                }),
              ],
            },
          },
        ],
      },
      { test: /\.html$/, loader: 'file-loader' },
    ],
  },
  plugins: [
    new HtmlGeneratorPlugin({
      compress: {
        minifyCSS: (text) => {
          return new CleanCSS().minify(postcss([prefixer])
            .process(text).content).styles;
        },
      },
      filename: 'e.[name].html',
      entries: { e1: false },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
    runtimeChunk: {
      name: 'manifest',
    },
    namedModules: true,
    noEmitOnErrors: true,
  },
  devtool: false,
});

compiler.run((error, stats) => {
  console.log('watch', stats.toString(), error);
});
