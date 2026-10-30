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

test('renders semantic quotes with rich text, all border colors and an optional source', () => {
  const quote = {
    _key: 'quote',
    _type: 'sitat',
    text: [{
      _key: 'paragraph', _type: 'block', style: 'normal',
      markDefs: [{_key: 'link', _type: 'link', href: 'https://example.no'}],
      children: [
        {_key: 'bold', _type: 'span', text: 'Klarhet', marks: ['strong']},
        {_key: 'italic', _type: 'span', text: ' og forståelse', marks: ['em']},
        {_key: 'link', _type: 'span', text: 'Les mer', marks: ['link']},
      ],
    }],
    source: 'Skatteetaten',
    blockName: 'Skjult sitatnavn',
  }
  for (const borderColor of [undefined, 'ochre', 'forest', 'denim', 'graphite']) {
    const html = render(ArticlePreview, {title: 'Artikkel', content: [{...quote, borderColor}]})
    assert.ok(html.includes('<blockquote'), html)
    assert.ok(html.includes(`data-border-color="${borderColor || 'ochre'}"`), html)
    assert.ok(html.includes('<strong>Klarhet</strong>'), html)
    assert.ok(html.includes('<em> og forståelse</em>'), html)
    assert.ok(html.includes('href="https://example.no"'), html)
    assert.ok(html.indexOf('Skatteetaten') > html.indexOf('</blockquote>'), html)
    assert.ok(!html.includes('Skjult sitatnavn'), html)
  }
  const html = render(SectionPagePreview, {
    title: 'Seksjonsside', sections: [{_key: 'section', content: [{...quote, source: undefined}]}],
  })
  assert.ok(html.includes('<blockquote'), html)
  assert.ok(!html.includes('Skatteetaten'), html)
  for (const content of [undefined, []]) {
    const empty = render(ArticlePreview, {title: 'Artikkel', content: [{...quote, text: content}]})
    assert.ok(!empty.includes('<blockquote'), empty)
    assert.ok(!empty.includes('Skatteetaten'), empty)
  }
})

test('renders secondary, primary and mega article buttons as links', () => {
  const appearances = [
    {appearance: 'secondary', className: 'button_secondary'},
    {appearance: 'primary', className: 'button_primary'},
    {appearance: 'mega', className: 'MegaButton'},
  ]

  for (const {appearance, className} of appearances) {
    const html = render(ArticlePreview, {
      title: 'Artikkel med knapp',
      content: [{
        _key: `button-${appearance}`,
        _type: 'knapp',
        label: 'Les mer',
        appearance,
        linkType: 'external',
        url: 'https://example.no/side',
      }],
    })
    assert.ok(html.includes('href="https://example.no/side"'), html)
    assert.ok(html.includes('Les mer'), html)
    assert.ok(html.includes(className), html)
    assert.ok(html.includes('padding:var(--spacing-s) 0'), html)
  }
})

test('renders accordion groups with large accordions and their nested rich text', () => {
  const html = render(ArticlePreview, {
    title: 'Artikkel med accordioner',
    content: [{
      _key: 'accordion-group',
      _type: 'accordionGroup',
      accordions: [
        {
          _key: 'accordion-one',
          title: 'Første spørsmål',
          content: [{
            _key: 'paragraph',
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [{_key: 'span', _type: 'span', text: 'Første svar', marks: []}],
          }],
        },
        { _key: 'accordion-two', title: 'Andre spørsmål', content: [] },
      ],
    }],
  })

  assert.ok(html.includes('Første spørsmål'), html)
  assert.ok(html.includes('Andre spørsmål'), html)
  assert.ok(html.includes('Første svar'), html)
  assert.ok(html.includes('large'), html)
})

test('renders OpenClose objects inside accordion portable text', () => {
  const html = render(ArticlePreview, {
    title: 'Artikkel med Åpne/Lukke i accordion',
    content: [{
      _key: 'accordion-group',
      _type: 'accordionGroup',
      accordions: [{
        _key: 'accordion',
        title: 'Spørsmål',
        content: [{
          _key: 'open-close',
          _type: 'openClose',
          title: 'Les mer',
          size: 'medium',
          content: [{
            _key: 'paragraph',
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [{_key: 'span', _type: 'span', text: 'Mer informasjon', marks: []}],
          }],
        }],
      }],
    }],
  })

  assert.ok(html.includes('Spørsmål'), html)
  assert.ok(html.includes('Les mer'), html)
  assert.ok(html.includes('medium'), html)
})

test('only numbers accordion groups when enabled and restarts numbering for each group', () => {
  const group = {
    _key: 'group',
    _type: 'accordionGroup',
    accordions: [
      {_key: 'first', title: 'Første spørsmål', content: []},
      {_key: 'second', title: 'Andre spørsmål', content: []},
    ],
  }
  for (const showNumbers of [undefined, false]) {
    const html = render(ArticlePreview, {content: [{...group, showNumbers}]})
    assert.ok(!html.includes('numbered-accordion'), html)
    assert.ok(!html.includes('role="list"'), html)
  }

  const html = render(ArticlePreview, {
    content: [
      {...group, showNumbers: true},
      {...group, _key: 'other-group', showNumbers: true},
    ],
  })
  assert.equal((html.match(/role="list"/g) || []).length, 2)
  assert.equal((html.match(/role="listitem"/g) || []).length, 4)
  assert.equal((html.match(/class="numbered-accordion-marker">1</g) || []).length, 2)
  assert.equal((html.match(/class="numbered-accordion-marker">2</g) || []).length, 2)
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 4)
})

test('supports numbered accordion groups inside article sections and incomplete drafts', () => {
  const group = {
    _key: 'group', _type: 'accordionGroup', showNumbers: true,
    accordions: [{_key: 'first', title: 'Spørsmål', content: text.text}],
  }
  const html = render(ArticlePreview, {
    content: [{_key: 'section', _type: 'seksjon', heading: 'Seksjon', content: [group]}],
  })
  assert.match(html, /<h2\b[^>]*><button[^>]*aria-expanded="false"/)
  assert.ok(html.includes('numbered-accordion-marker">1</span>'), html)
  assert.ok(!html.includes('numbered-accordion-marker">2</span>'), html)

  for (const accordions of [undefined, []]) {
    const empty = render(ArticlePreview, {content: [{...group, accordions}]})
    assert.ok(empty.includes('Legg til minst én accordion'), empty)
    assert.ok(!empty.includes('numbered-accordion-marker'), empty)
  }
  const incomplete = render(ArticlePreview, {
    content: [{...group, accordions: [{_key: 'untitled'}, ...group.accordions]}],
  })
  assert.ok(incomplete.includes('Legg til en overskrift'), incomplete)
  assert.equal((incomplete.match(/role="listitem"/g) || []).length, 2)
  assert.ok(incomplete.includes('numbered-accordion-marker">2</span>'), incomplete)
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
