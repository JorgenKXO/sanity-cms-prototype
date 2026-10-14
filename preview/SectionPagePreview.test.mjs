import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, rm} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const directory = await mkdtemp(`${root}node_modules/.section-preview-tests-`)
after(() => rm(directory, {recursive: true, force: true}))
await build({
  stdin: {
    contents: `
      export {SectionPagePreview} from './preview/SectionPagePreview'
      export {ArticlePreview} from './preview/ArticlePreview'
    `,
    resolveDir: root,
    loader: 'ts',
  },
  outfile: `${directory}/preview.mjs`,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: {'.css': 'empty'},
  plugins: [{
    name: 'offline-preview',
    setup(builder) {
      builder.onResolve({filter: /^@skatteetaten\//}, (args) => ({
        path: require.resolve(args.path),
      }))
      builder.onResolve({filter: /^sanity$/}, (args) => {
        if (args.importer.endsWith('/ArticlePreview.tsx')) {
          return {path: 'preview-client', namespace: 'offline-client'}
        }
      })
      builder.onLoad({filter: /.*/, namespace: 'offline-client'}, () => ({
        contents: `
          import {createClient} from '@sanity/client'
          export function useClient() {
            return createClient({
              projectId: 'test1234', dataset: 'production',
              apiVersion: '2026-09-10', useCdn: false,
            })
          }
        `,
        loader: 'js',
        resolveDir: root,
      }))
    },
  }],
})
const {SectionPagePreview, ArticlePreview} = await import(
  pathToFileURL(`${directory}/preview.mjs`).href
)
const text = {
  _key: 'text',
  _type: 'tekst',
  text: [{
    _key: 'paragraph',
    _type: 'block',
    style: 'h2',
    markDefs: [],
    children: [{_key: 'span', _type: 'span', text: 'Underoverskrift', marks: []}],
  }],
}
const page = {
  title: 'Testside',
  sections: [1, 2].map((index) => ({
    _key: `section-${index}`,
    blockName: `Skjult redaktørnavn ${index}`,
    heading: `Seksjon ${index}`,
    icon: 'completed',
    content: [text],
  })),
}
const render = (Component, displayed) => renderToStaticMarkup(
  createElement(Component, {document: {displayed}}),
)

test('renders green boundaries matching the original section prototype', () => {
  const html = render(SectionPagePreview, page)
  assert.equal((html.match(/border-top:2px solid var\(--palette-forest-50\)/g) || []).length, 2)
  assert.equal((html.match(/border-bottom:2px solid var\(--palette-forest-50\)/g) || []).length, 1)
  assert.ok(html.indexOf('Seksjon 1') < html.indexOf('Seksjon 2'))
  assert.ok(!html.includes('Skjult redaktørnavn'))
  assert.equal((html.match(/<h2\b/g) || []).length, 2)
  assert.equal((html.match(/<h3\b/g) || []).length, 2)
  assert.ok(html.includes('aria-hidden="true"'))
})

test('preserves regular article headings and does not add section borders', () => {
  const html = render(ArticlePreview, {title: 'Artikkel', content: [text]})
  assert.ok(html.includes('<h2'))
  assert.ok(!html.includes('border-top:'))
  assert.ok(!html.includes('<section'))
})

test('preserves article section blocks, circle icons and shared references', () => {
  const html = render(ArticlePreview, {
    title: 'Artikkel med seksjoner',
    content: [{
      _key: 'section',
      _type: 'seksjon',
      heading: 'Artikkelseksjon',
      icon: 'completed',
      content: [text, {_key: 'shared', _type: 'reference', _ref: 'shared-test'}],
    }],
  })
  assert.ok(html.includes('Artikkelseksjon'))
  assert.ok(html.includes('section-icon-circle'))
  assert.ok(html.includes('border-top:2px solid var(--palette-forest-50)'))
  assert.ok(html.includes('border-bottom:2px solid var(--palette-forest-50)'))
  assert.ok(html.includes('Referert delt innhold ble ikke funnet.'))
  assert.equal((html.match(/<h2\b/g) || []).length, 2)
})

test('supports incomplete section page drafts', () => {
  for (const displayed of [{}, {sections: []}, {sections: [{_key: 'empty'}]}]) {
    assert.doesNotThrow(() => render(SectionPagePreview, displayed))
  }
})
