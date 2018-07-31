# webpack-html-generator-plugin

A webpack plugin to generate html for each entry

## Install

```bash
# var npm
npm i -D webpack-html-generator-plugin

# var yarn
yarn add -D webpack-html-generator-plugin
```

## Quick Start

Generate a html entry for each entrypoint to include all `script` &
`style` files, use default template.

```typescript
// webpack.config.ts
import { HtmlGeneratorPlugin } from './src/index'

// multiple entries
const entries = {
  admin: './src/admin.ts',
  pc: './src/web.ts',
}

export default {
  entry: entries,
  output: {
    path: process.cwd() + '/dist',
  },
  plugins: [
    new HtmlGeneratorPlugin(/* options */)
  ],
}
```

## Options

```typescript
import { SMap } from 'monofile-utilities/lib/map'

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
  compress?: boolean;
  entries?: SMap<HtmlInput | false>;
}
```

## Licence

[MIT](./LICENCE)
