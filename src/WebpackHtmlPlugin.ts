/*!
 *
 * Copyright 2016 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2016-11-11 15:29:57
 * @version 1.0.0
 * @desc WebpackHtmlPlugin.ts
 */


import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  EmptyCallback,
  Compilation,
  IPlugin,
  Compiler
} from 'path-rewrite-plugin/lib/declarations'
import { compile } from 'ejs'
import { minify } from 'html-minifier'
import webpack = require('webpack')


const tpl = readFileSync(resolve(__dirname, '../template.html'), 'utf8')

export interface WebpackHtmlPluginOptions {
  commonsChunk?: string;
  template?: string|((data: any) => string);
  entryVariables?: {[key: string]: {[key: string]: string}};
  globalVariables?: {[key: string]: {[key: string]: string}};
  header?: string;
  content?: string;
  dist?: string;
  compress?: boolean;
}


export class WebpackHtmlPlugin implements IPlugin {
  private options: WebpackHtmlPluginOptions
  private compile: (obj: any) => string

  constructor(
    {
      commonsChunk = 'vendor',
      template = tpl,
      dist = '[name].html',
      header = '',
      content = '<div id="root"></div>',
      entryVariables = {},
      globalVariables = {},
      compress = true,
    }: WebpackHtmlPluginOptions = {}
  ) {
    this.options = {
      commonsChunk,
      template,
      dist,
      entryVariables,
      globalVariables,
      header,
      content,
      compress,
    }

    this.compile = typeof this.options.template === 'function'
      ? this.options.template as any
      : compile(this.options.template as any)
  }

  private assign(target: any, ...args: any[]) {
    args.forEach((item) => {
      if (item) {
        for (let i in item) {
          if (item.hasOwnProperty(i)) {
            target[i] = item[i]
          }
        }
      }
    })
    return target
  }


  private isJs(name: string) { return name.indexOf('.js', -3) > -1 }

  private isCss(name: string) { return name.indexOf('.css', -4) > -1 }

  private getVariables(asset: string|string[], compilation: Compilation) {
    const assets: string[] = Array.isArray(asset) ? asset : [asset]

    const base  = compilation.options.output.publicPath
    let links   = ''
    let scripts = ''

    assets.forEach((filename) => {
      if (this.isJs(filename)) {
        scripts += `<script src="${base + filename}"></script>`
      } else if (this.isCss(filename)) {
        links += `<link rel="stylesheet" href="${base + filename}"/>`
      }
    })
    return { links, scripts }
  }


  private emitHtml(compilation: Compilation, callback: EmptyCallback) {
    const chunks = compilation.getStats().toJson().assetsByChunkName
    const assets = compilation.assets

    const commons = this.options.commonsChunk
      ? this.getVariables(chunks[this.options.commonsChunk] || '', compilation)
      : { links: '', scripts: '' }

    for (let name in chunks) {
      if (name === this.options.commonsChunk) { continue }
      const filename = this.options.dist.replace(/\[name]/g, name)

      const variables: {[key: string]: string} = {
        header : this.options.header,
        content: this.options.content,
        title  : name.replace(/[\/_]/g, ' '),
        head   : '',
      }

      const locals = this.getVariables(chunks[name], compilation)

      locals.links   = commons.links + locals.links
      locals.scripts = commons.scripts + locals.scripts

      this.assign(
        variables,
        locals,
        this.options.globalVariables,
        this.options.entryVariables[name],
      )

      console.log(variables)

      let content = this.compile(variables)

      this.options.compress && (content = minify(content, {
        collapseBooleanAttributes    : true,
        collapseWhitespace           : true,
        minifyCSS                    : true,
        minifyJS                     : true,
        removeAttributeQuotes        : true,
        removeComments               : true,
        removeEmptyAttributes        : true,
        removeRedundantAttributes    : true,
        removeScriptTypeAttributes   : true,
        removeStyleLinkTypeAttributes: true,
      }))

      assets[filename] = {
        source: () => content,
        size  : () => content.length,
      }
    }

    callback()
  }

  apply(compiler: Compiler) {
    compiler.plugin('emit', this.emitHtml.bind(this))
  }
}
