/*!
 *
 * Copyright 2016 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2016-11-11 15:29:57
 * @version 1.0.0
 * @desc WebpackHtmlPlugin.ts
 */

import { compile } from 'ejs';
import * as fs from 'fs';
import { minify, Options } from 'html-minifier';
import { evalJSON } from 'monofile-utilities/lib/json';
import { SMap } from 'monofile-utilities/lib/map';
import * as path from 'path';
import { Tapable } from 'tapable';
import { __assign } from 'tslib';
import webpack, { Entry } from 'webpack';
import CallbackFunction = Tapable.CallbackFunction;

export type TemplateFunction = (data: { data: HtmlInput }) => string

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
  template?: TemplateFunction;
}

export interface WebpackHtmlGeneratorPluginOptions extends HtmlInput {
  filename?: string;
  compress?: boolean | Options;
  entries?: SMap<HtmlInput | false>;
  entryLoader?: typeof loadEntries;
}

function isJs(name: string) {
  return name.lastIndexOf('.js') === name.length - 3;
}

function isCss(name: string) {
  return name.lastIndexOf('.css') === name.length - 4;
}

export const defaultTemplate: TemplateFunction = compile(
  fs.readFileSync(path.resolve(__dirname, '../template.html'), 'utf8'),
);

export function loadEntries(
  entries: SMap<string | string[]>,
  predefined: SMap<HtmlInput | false> = {},
  context = process.cwd(),
) {
  return Object.keys(entries).reduce((map, name) => {
    if (name in predefined) {
      map[name] = predefined[name];
    } else {
      const entry = entries[name];
      let index = Array.isArray(entry) ? entry[entry.length - 1] : entry;
      index = path.isAbsolute(index) ? index : path.join(context, index);
      if (fs.existsSync(index) && fs.statSync(index).isDirectory()) {
        index = path.join(index, 'index');
      } else {
        index = index.replace(/\.[^.\/\\]*$/, '');
      }
      const config: HtmlInput = {};
      const configFile = `${index}.json`;
      if (fs.existsSync(configFile)) {
        try {
          const data = evalJSON(fs.readFileSync(configFile, 'utf8')).template;
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              if (data[key] === null) {
                (config as any)[key] = '';
              } else if (data[key]) {
                (config as any)[key] = data[key];
              }
            }
          }
        } catch {
        }
      }
      const templateFile = `${index}.html`;
      if (fs.existsSync(templateFile)) {
        config.template = compile(fs.readFileSync(templateFile, 'utf8'));
      }
      map[name] = config;
    }
    return map;
  }, {} as SMap<HtmlInput | false>);
}

export class HtmlGeneratorPlugin {
  private readonly options: Required<WebpackHtmlGeneratorPluginOptions>;
  private publicPath = '';
  private readonly compressOptions: Options;

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
    template = defaultTemplate,
    filename = '[name].html',
    compress = true,
    entries = {},
    entryLoader = loadEntries,
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
      entryLoader,
    };
    this.compressOptions = {
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
    };
    if (typeof compress === 'object') {
      Object.assign(this.compressOptions, compress);
    }
  }

  private emitHtml(
    compilation: webpack.compilation.Compilation,
    callback: CallbackFunction,
  ) {
    const entries = compilation.entrypoints;
    const assets = compilation.assets;
    entries.forEach((entry, name) => {
      if (this.options.entries[name] === false || assets[name]) {
        return;
      }
      const filename = this.options.filename.replace(/\[name]/g, name);
      const variables: Required<HtmlInput> = __assign(
        {},
        this.options,
        this.options.entries[name] || {},
      );
      let scripts = '';
      let links = '';
      (entry.chunks || []).forEach((chunk: webpack.compilation.Chunk) => {
        (chunk.files || []).forEach((filename) => {
          if (isJs(filename)) {
            scripts += `<script src="${this.publicPath + filename}"></script>\n`;
          } else if (isCss(filename)) {
            links += `<link rel="stylesheet" href="${this.publicPath + filename}"/>\n`;
          }
        });
      });

      variables.links = links;
      variables.scripts = scripts;

      let content = variables.template({ data: variables });

      this.options.compress && (content = minify(
        content, this.compressOptions));

      assets[filename] = {
        source: () => content,
        size: () => content.length,
      };
    });

    callback();
  }

  apply(compiler: webpack.Compiler) {
    this.publicPath = compiler.options.output!.publicPath!;
    this.options.entries = this.options.entryLoader(
      compiler.options.entry as Entry,
      this.options.entries,
      compiler.options.context,
    );
    compiler.hooks.emit.tapAsync('html-generator', this.emitHtml.bind(this));
  }
}
