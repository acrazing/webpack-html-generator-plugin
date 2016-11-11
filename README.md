# webpack-html-plugin

A webpack plugin to generate html for each entry

## Install

```bash
npm i -D webpack-html-plugin
```

## Usage

Add follow config to your webpack config

```js
// webpack.config.js
const WebpackHtmlPlugin = require('webpack-html-plugin')

module.exports = {
  // ...other configs
  plugins: [
    // ...other plugins
    new WebpackHtmlPlugin(),
  ]
}

```

## Result

For each entry, this will generate a html file include all the entry's `chunks`
and `commonsChunk` according to config.

For example:

The config as <./src/WebpackHtmlPlugin.spec.ts>:

```ts
import webpack = require('webpack');
import { resolve } from 'path';
import { WebpackHtmlPlugin } from './WebpackHtmlPlugin';
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
```

The project content as <./__mock__>, and the build with webpack will generate
a html file `two.html` as follow:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset=UTF-8>
    <meta http-equiv=X-UA-Compatible content="IE=edge,chrome=1">
    <meta name=viewport
          content="width=device-width,height=device-height,initial-scale=1,maximum-scale=1">
    <meta name=renderer content=webkit>
    <meta name=Pragma content=no-cache>
    <title>two</title>
    <link rel=stylesheet href=/two.9fc0c68fc7cb2da0c0e39b5b2cf02c42.css>
</head>
<body>
<div id=root></div>
<script src=/vendor.8c08871843651cd865be.js></script>
<script src=/two.f52ef4485970f17a530e.js></script>
</body>
</html>
```

## Options

```ts

export interface WebpackHtmlPluginOptions {
  // commonsChunk name, default is vendor, if set as empty string,
  // will ignore
  commonsChunk?: string;
  // template html or compile function
  // if is string, will be compiled by ejs with ejs.compile(template)
  // default see ./template.html
  template?: string|((data: any) => string);
  // variables for specified entry
  // default is empty
  entryVariables?: {[key: string]: {[key: string]: string}};
  // common variables for all entry
  // if same name exits in entryVariables[entry], will
  // be override
  // default is {}
  globalVariables?: {[key: string]: {[key: string]: string}};
  // other header variable for default template
  // default is ''
  header?: string;
  // content variable for default template
  content?: string;
  // the filename to emit, `[name]` will be replaced
  // by the entry name
  // default is `[name].html`
  dist?: string;
  // compress html or not by html-minifier
  // default is true
  compress?: boolean;
}


// usage:

new WebpackHtmlPlugin(options);
```

- the template compile engine is [ejs](https://github.com/tj/ejs), you can uses 
any syntax supported by it.
- each entry will generate a html file except for `commonsChunk` specified one,
this one will be included by each other entry.
- the variables invoked for template function include all `entryVariables[entry]`
and `globalVariables` and `header`, `content`, and
    - `links`: the compiled stylesheet link tags
    - `scripts`: the compiled script tags

## Licence

[MIT](./LICENCE)