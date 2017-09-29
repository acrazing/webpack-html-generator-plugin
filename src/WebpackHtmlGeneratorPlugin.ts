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
import { resolve } from 'path'

const tpl = readFileSync(resolve(__dirname, '../template.html'), 'utf8')

export interface WebpackHtmlGeneratorPluginOptions {
  template?: string | ((data: any) => string);
  entryVariables?: { [entry: string]: { [key: string]: string } };
  globalVariables?: { [key: string]: string };
  head?: string;
  content?: string;
  dist?: string;
  compress?: boolean;
  ignores?: string[];
}

function assign(target: any, ...args: any[]) {
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

function isJs(name: string) {
  return name.indexOf('.js', -3) > -1
}

function isCss(name: string) {
  return name.indexOf('.css', -4) > -1
}

interface Compilation {
  options: {
    output: {
      publicPath: string;
    };
  };
  getStats(): {
    toJson(): {
      entrypoints: Array<{
        chunks: number[];
        assets: string[];
        isOverSizeLimit: boolean;
      }>;
    };
  };
  assets: {
    [key: string]: {
      size(): number;
      source(): string;
    };
  };
}

export interface Compiler {
  plugin(event: string, callback: Function): void;
}

export class WebpackHtmlGeneratorPlugin {
  private options: WebpackHtmlGeneratorPluginOptions
  private compile: (obj: any) => string

  constructor(
    {
      template = tpl,
      dist = '[name].html',
      head = '',
      content = '<div id="root"></div>',
      entryVariables = {},
      globalVariables = {},
      compress = true,
      ignores = [],
    }: WebpackHtmlGeneratorPluginOptions = {},
  ) {
    this.options = {
      template,
      dist,
      entryVariables,
      globalVariables,
      head,
      content,
      compress,
      ignores,
    }

    this.compile = typeof this.options.template === 'function'
      ? this.options.template as any
      : compile(this.options.template as any)
  }

  private emitHtml(compilation: Compilation, callback: (error?: Error) => void) {
    const entries = compilation.getStats().toJson().entrypoints
    const assets = compilation.assets
    const base = compilation.options.output.publicPath

    for (let name in entries) {
      if (
        ~this.options.ignores.indexOf(name)
        || assets[name]
      ) {
        continue
      }
      const filename = this.options.dist.replace(/\[name]/g, name)

      const variables: { [key: string]: string } = {
        htmlClass: '',
        bodyClass: '',
        header: '',
        footer: '',
        content: this.options.content,
        title: name.replace(/[\/_]/g, ' '),
        head: this.options.head,
      }

      let scripts = ''
      let links = ''

      entries[name].assets.forEach((filename) => {
        if (isJs(filename)) {
          scripts += `<script src="${base + filename}"></script>`
        } else if (isCss(filename)) {
          links += `<link rel="stylesheet" href="${base + filename}"/>`
        }
      })

      assign(
        variables,
        { links, scripts },
        this.options.globalVariables,
        this.options.entryVariables[name],
      )

      let content = this.compile(variables)

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
    }

    callback()
  }

  apply(compiler: Compiler) {
    compiler.plugin('emit', this.emitHtml.bind(this))
  }
}
