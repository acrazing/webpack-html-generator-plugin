/*!
 *
 * Copyright 2016 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2016-11-11 15:29:57
 * @version 1.0.0
 * @desc WebpackHtmlPlugin.ts
 */

import { compile } from 'ejs'
import { readFileSync } from 'fs'
import { minify } from 'html-minifier'
import { SMap } from 'monofile-utilities/lib/map'
import { resolve } from 'path'
import { Tapable } from 'tapable'
import { __assign } from 'tslib'
import webpack from 'webpack'
import CallbackFunction = Tapable.CallbackFunction

export interface HtmlInput {
  htmlClass?: string;
  title?: string;
  keywords?: string;
  description?: string;
  head?: string;
  links?: string;
  bodyClass?: string;
  header?: string;
  content?: string;
  scripts?: string;
  footer?: string;
  template?: (data: { data: HtmlInput }) => string;
}

export interface WebpackHtmlGeneratorPluginOptions extends HtmlInput {
  filename?: string;
  compress?: boolean;
  entries?: SMap<HtmlInput | false>;
}

const defaultTpl = compile(
  readFileSync(resolve(__dirname, '../template.html'), 'utf8'),
)

function isJs(name: string) {
  return name.lastIndexOf('.js') === name.length - 3
}

function isCss(name: string) {
  return name.lastIndexOf('.css') === name.length - 4
}

export class WebpackHtmlGeneratorPlugin {
  private options: Required<WebpackHtmlGeneratorPluginOptions>
  private publicPath = ''

  constructor({
    htmlClass = '',
    title = '',
    keywords = '',
    description = '',
    head = '',
    links = '',
    bodyClass = '',
    header = '',
    content = '<div id="root"></div>',
    scripts = '',
    footer = '',
    template = defaultTpl,
    filename = '[name].html',
    compress = true,
    entries = {},
  }: WebpackHtmlGeneratorPluginOptions = {}) {
    this.options = {
      htmlClass,
      title,
      keywords,
      description,
      head,
      links,
      bodyClass,
      header,
      content,
      scripts,
      footer,
      template,
      filename,
      compress,
      entries,
    }
  }

  private emitHtml(
    compilation: webpack.compilation.Compilation,
    callback: CallbackFunction,
  ) {
    const entries = compilation.entrypoints
    const assets = compilation.assets
    entries.forEach((entry, name) => {
      if (this.options.entries[name] === false || assets[name]) {
        return
      }
      const filename = this.options.filename.replace(/\[name]/g, name)
      const variables: Required<HtmlInput> = __assign(
        {},
        this.options.entries[name] || {},
        this.options,
      )
      let scripts = ''
      let links = '';
      (entry.chunks || []).forEach((chunk: webpack.compilation.Chunk) => {
        (chunk.files || []).forEach((filename) => {
          if (isJs(filename)) {
            scripts += `<script src="${this.publicPath + filename}"></script>\n`
          } else if (isCss(filename)) {
            links += `<link rel="stylesheet" href="${this.publicPath + filename}"/>\n`
          }
        })
      })

      variables.links = links
      variables.scripts = scripts

      let content = variables.template({ data: variables })

      this.options.compress && (content = minify(content, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
      }))

      assets[filename] = {
        source: () => content,
        size: () => content.length,
      }
    })

    callback()
  }

  apply(compiler: webpack.Compiler) {
    this.publicPath = compiler.options.output!.publicPath!
    compiler.hooks.emit.tapAsync('html-generator', this.emitHtml.bind(this))
  }
}
