import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {act, createElement} from 'react'
import {createRoot} from 'react-dom/client'
import {renderToStaticMarkup} from 'react-dom/server'
import {JSDOM} from 'jsdom'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const directory = await mkdtemp(`${root}node_modules/.section-preview-tests-`)
const iconSource = await readFile(new URL('../components/SectionIcons.tsx', import.meta.url), 'utf8')
const iconExports = [...new Set(iconSource.match(/\b[A-Z][A-Za-z0-9]*Icon\b/g) || [])]
const iconModule = `import {jsx} from 'react/jsx-runtime'\n${
  iconExports.map((name) => `export const ${name} = () => jsx('svg', {})`).join('\n')
}`
after(() => rm(directory, {recursive: true, force: true}))
await build({
  stdin: {
    contents: `
      export {SectionPagePreview} from './preview/SectionPagePreview'
      export {ArticlePreview} from './preview/ArticlePreview'
      export {ArticleButton, getButtonLinks} from './preview/ArticleButton'
      export {ArticleLinkList} from './preview/ArticleLinkList'
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
      builder.onResolve({filter: /^@skatteetaten\/ds-icons$/}, (args) =>
        args.importer.endsWith('/components/SectionIcons.tsx')
          ? {
              path: 'section-preview-icon-stubs',
              namespace: 'section-preview-icon-stubs',
            }
          : undefined,
      )
      builder.onLoad({filter: /.*/, namespace: 'section-preview-icon-stubs'}, () => ({
        contents: iconModule,
        loader: 'js',
        resolveDir: root,
      }))
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
            if (globalThis.articlePreviewTestClient) return globalThis.articlePreviewTestClient
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
const {SectionPagePreview, ArticlePreview, ArticleButton, getButtonLinks, ArticleLinkList} = await import(
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

test('renders ordered semantic LinkGroup lists with page titles and internal URLs', () => {
  const pages = [
    {_key: 'second', _ref: 'second'},
    {_key: 'first', _ref: 'first'},
  ]
  const destinationsById = {
    first: {title: 'Første side', slug: {current: 'kategori/forste-side'}},
    second: {title: 'Andre side', slug: {current: 'andre-side'}},
  }
  for (const selectedPages of [[pages[0]], pages]) {
    const html = renderToStaticMarkup(createElement(ArticleLinkList, {
      block: {_type: 'lenkeliste', blockName: 'Skjult navn', pages: selectedPages},
      destinationsById,
      isLoading: false,
    }))
    assert.match(html, /<ul\b/)
    assert.equal((html.match(/<li\b/g) || []).length, selectedPages.length)
    assert.equal((html.match(/<a\b/g) || []).length, selectedPages.length)
    assert.match(html, /href="\/andre-side"/)
    assert.ok(!html.includes('Skjult navn'))
    if (selectedPages.length > 1) {
      assert.match(html, /href="\/kategori\/forste-side"/)
      assert.ok(html.indexOf('Andre side') < html.indexOf('Første side'))
    }
  }
})

test('shows link-list empty, invalid, loading, missing-page and fetch-error states', () => {
  const renderList = (pages, props = {}) => renderToStaticMarkup(createElement(ArticleLinkList, {
    block: {_type: 'lenkeliste', pages},
    destinationsById: {},
    isLoading: false,
    ...props,
  }))
  for (const pages of [undefined, []]) {
    assert.match(renderList(pages), /role="status"[\s\S]*Legg til minst én side/)
  }
  assert.match(renderList([{}]), /role="status"[\s\S]*Velg en Sanity-side/)
  const pages = [{_ref: 'target'}]
  assert.match(renderList(pages, {isLoading: true}), /role="status"[\s\S]*Laster sidene/)
  for (const destination of [undefined, {title: 'Side'}, {slug: {current: 'side'}}, {
    title: ' ', slug: {current: 'side'},
  }]) {
    const html = renderList(pages, {destinationsById: {target: destination}})
    assert.match(html, /role="alert"/)
    assert.ok(!html.includes('<a'))
  }
  assert.match(renderList(pages, {error: 'Nettverksfeil'}), /role="alert"[\s\S]*Nettverksfeil/)
  const partial = renderList([{_ref: 'valid'}, ...pages], {
    destinationsById: {valid: {title: 'Gyldig side', slug: {current: 'gyldig'}}},
  })
  assert.match(partial, /role="alert"/)
  assert.ok(!partial.includes('<a'))
})

test('allows overriding link text while keeping the original title as the default', () => {
  const renderList = (label, destination = {title: 'Originaltittel', slug: {current: 'side'}}) =>
    renderToStaticMarkup(createElement(ArticleLinkList, {
      block: {_type: 'lenkeliste', pages: [{
        _key: 'link', _type: 'linkListItem', page: {_ref: 'target'}, label,
      }]},
      destinationsById: {target: destination},
      isLoading: false,
    }))
  const custom = renderList('Egen lenketekst')
  assert.match(custom, /href="\/side"/)
  assert.ok(custom.includes('Egen lenketekst'))
  assert.ok(!custom.includes('Originaltittel'))
  for (const label of [undefined, '', '   ']) {
    assert.ok(renderList(label).includes('Originaltittel'))
  }
  assert.ok(renderList('Egen tekst', {slug: {current: 'side'}}).includes('Egen tekst'))
  for (const destination of [undefined, {title: 'Originaltittel'}]) {
    const html = renderList('Egen tekst', destination === undefined ? {} : destination)
    assert.match(html, /role="alert"/)
    assert.ok(!html.includes('<a'))
  }
})

test('renders optional link-list heading and ingress before links with contextual heading levels', () => {
  const renderList = (fields, nested = false) => renderToStaticMarkup(createElement(ArticleLinkList, {
    block: {_type: 'lenkeliste', pages: [{_ref: 'target'}], ...fields},
    destinationsById: {target: {title: 'Lenketittel', slug: {current: 'side'}}},
    isLoading: false,
    nested,
  }))
  for (const nested of [false, true]) {
    const html = renderList({heading: 'Nyttige lenker', ingress: 'Finn flere opplysninger her.'}, nested)
    assert.match(html, nested ? /<h3\b/ : /<h2\b/)
    assert.match(html, /<h[23]\b[^>]*data-level="4"/)
    assert.match(html, /<h[23]\b[^>]*class="[^"]*article-link-list-intro[^"]*"/)
    assert.match(html, /<p\b[^>]*class="[^"]*article-link-list-intro[^"]*"/)
    assert.ok(!/<(?:h[23]|p)\b[^>]*data-has-spacing="true"/.test(html))
    assert.ok(html.indexOf('Nyttige lenker') < html.indexOf('Finn flere opplysninger her.'))
    assert.ok(html.indexOf('Finn flere opplysninger her.') < html.indexOf('<ul'))
    assert.match(html, /<p\b[^>]*data-ingress="true"/)
  }
  for (const fields of [{}, {heading: '', ingress: ''}, {heading: ' ', ingress: ' '}]) {
    const html = renderList(fields)
    assert.ok(!/<h[23]\b|<p\b/.test(html))
    assert.match(html, /Lenketittel/)
  }
  assert.match(renderList({heading: 'Kun overskrift'}), /<h2\b/)
  assert.ok(!/<p\b/.test(renderList({heading: 'Kun overskrift'})))
  assert.match(renderList({ingress: 'Kun ingress'}), /<p\b/)
  assert.ok(!renderList({ingress: 'Kun ingress'}).includes('<h2'))
})

test('resolves and deduplicates page references in examples, link lists and buttons', async () => {
  const dom = new JSDOM('<div id="root"></div>')
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const pending = []
  globalThis.articlePreviewTestClient = {
    config: () => ({projectId: 'test1234', dataset: 'production'}),
    withConfig(config) {
      assert.equal(config.perspective, 'drafts')
      return this
    },
    fetch(query, parameters) {
      return new Promise((resolve, reject) => pending.push({query, parameters, resolve, reject}))
    },
  }
  const reactRoot = createRoot(document.getElementById('root'))
  const list = {
    _key: 'list', _type: 'lenkeliste',
    heading: 'Relaterte sider',
    ingress: 'Se også disse sidene.',
    pages: [
      {_key: 'b', _type: 'linkListItem', page: {_ref: 'page-b'}, label: 'Egen tekst B'},
      {_key: 'a', _ref: 'page-a'},
    ],
  }
  const button = {
    _key: 'button', _type: 'knapp', label: 'Knapp', appearance: 'secondary',
    linkType: 'internal', page: {_ref: 'page-a'},
  }
  const example = {
    _key: 'example', _type: 'eksempel',
    text: [{
      _key: 'paragraph',
      _type: 'block',
      style: 'normal',
      markDefs: [{
        _key: 'page-link',
        _type: 'pageLink',
        page: {_type: 'reference', _ref: 'page-c'},
      }],
      children: [{_key: 'span', _type: 'span', text: 'Se eksempelet', marks: ['page-link']}],
    }],
  }
  const renderArticle = async (content) => act(async () => {
    reactRoot.render(createElement(ArticlePreview, {document: {displayed: {content}}}))
  })
  try {
    await renderArticle([list, button, example])
    assert.deepEqual(pending[0].parameters, {ids: ['page-b', 'page-a', 'page-c']})
    assert.match(pending[0].query, /title/)
    assert.match(document.body.textContent, /Laster lenkemål/)
    await act(async () => pending[0].resolve([
      {_id: 'page-a', title: 'Side A', slug: {current: 'side-a'}},
      {_id: 'page-b', title: 'Side B', slug: {current: 'side-b'}},
      {_id: 'page-c', title: 'Side C', slug: {current: 'side-c'}},
    ]))
    assert.deepEqual([...document.querySelectorAll('li a')].map((link) => [
      link.textContent, link.getAttribute('href'),
    ]), [['Egen tekst B', '/side-b'], ['Side A', '/side-a']])
    assert.equal(document.querySelector('a[href="/side-a"]:not(li a)').textContent, 'Knapp')
    assert.equal(document.querySelector('blockquote a[href="/side-c"]').textContent, 'Se eksempelet')
    assert.equal(document.querySelector('h2').textContent, 'Relaterte sider')

    await renderArticle([{_key: 'section', _type: 'seksjon', heading: 'Seksjon', content: [list, example]}])
    assert.equal(pending.length, 1)
    assert.equal(document.querySelectorAll('section li a').length, 2)
    assert.equal(document.querySelector('section blockquote a[href="/side-c"]').textContent, 'Se eksempelet')
    assert.equal(document.querySelector('section h3').textContent, 'Relaterte sider')
    await renderArticle([{_key: 'section', _type: 'seksjon', content: [list, example]}])
    assert.equal(document.querySelector('section h2').textContent, 'Relaterte sider')

    await renderArticle([{...list, pages: [{_ref: 'stale'}]}])
    await renderArticle([example])
    await act(async () => pending[1].resolve([
      {_id: 'stale', title: 'Utdatert side', slug: {current: 'utdatert'}},
    ]))
    assert.ok(!document.body.textContent.includes('Utdatert side'))
    await act(async () => pending[2].reject(new Error('Nettverksfeil')))
    assert.match(
      document.querySelector('[role="alert"]').textContent,
      /Kunne ikke hente lenkemålet: Nettverksfeil/,
    )
    await renderArticle([])
    assert.equal(document.querySelector('[role="alert"]'), null)

    await act(async () => reactRoot.render(createElement(SectionPagePreview, {
      document: {displayed: {sections: [{_key: 'section', content: [{
        ...example,
        text: [{
          ...example.text[0],
          markDefs: [{
            ...example.text[0].markDefs[0],
            page: {_type: 'reference', _ref: 'section-target'},
          }],
        }],
      }]}]}},
    })))
    assert.deepEqual(pending[3].parameters, {ids: ['section-target']})
    await act(async () => pending[3].resolve([
      {_id: 'section-target', title: 'Målside', slug: {current: 'malside'}},
    ]))
    assert.equal(document.querySelector('blockquote a[href="/malside"]').textContent, 'Se eksempelet')
  } finally {
    await act(async () => reactRoot.unmount())
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
    delete globalThis.articlePreviewTestClient
  }
})

test('renders green boundaries matching the original section prototype', () => {
  const html = render(SectionPagePreview, page)
  assert.equal((html.match(/border-top:2px solid var\(--palette-forest-50\)/g) || []).length, 2)
  assert.equal((html.match(/border-bottom:2px solid var\(--palette-forest-50\)/g) || []).length, 1)
  assert.ok(html.indexOf('Seksjon 1') < html.indexOf('Seksjon 2'))
  assert.ok(!html.includes('Skjult redaktørnavn'))
  assert.equal((html.match(/<h2\b/g) || []).length, 2)
  assert.equal((html.match(/<h3\b/g) || []).length, 2)
  assert.ok(html.includes('aria-hidden="true"'))
  assert.equal((html.match(/class="section-icon-circle"/g) || []).length, 2)
  assert.equal((html.match(/background:var\(--palette-graphite-100\)/g) || []).length, 2)
  assert.equal((html.match(/color:var\(--palette-graphite-0\)/g) || []).length, 2)
  assert.equal((html.match(/display:flex;gap:var\(--spacing-xl\);align-items:flex-start/g) || []).length, 2)
})

test('shows added system icons in centered white-on-black circles beside section text', () => {
  const html = render(SectionPagePreview, {
    title: 'Seksjonsside med nytt ikon',
    sections: [{
      _key: 'person-section',
      heading: 'For personer',
      icon: 'Person',
      content: [text],
    }],
  })

  assert.match(html, /class="section-icon-circle"[^>]*background:var\(--palette-graphite-100\)/)
  assert.match(html, /class="section-icon-circle"[^>]*color:var\(--palette-graphite-0\)/)
  assert.match(html, /class="section-icon-circle"[^>]*justify-content:center/)
  assert.match(html, /align-items:flex-start/)
  assert.ok(html.indexOf('section-icon-circle') < html.indexOf('For personer'))
  assert.ok(html.includes('Underoverskrift'))
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

test('renders examples as a fixed yellow Blockquote with rich text and no author', () => {
  const html = render(ArticlePreview, {
    title: 'Artikkel med eksempel',
    content: [{
      _key: 'example',
      _type: 'eksempel',
      blockName: 'Skjult navn',
      source: 'Skjult avsender',
      text: [{
        _key: 'paragraph',
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [{_key: 'span', _type: 'span', text: 'Gjør dette', marks: ['strong']}],
      }],
    }],
  })

  assert.match(html, /<blockquote[^>]*data-border-color="ochre"/)
  assert.match(html, /<h2\b/)
  assert.match(html, /<strong>Gjør dette<\/strong>/)
  assert.ok(!html.includes('Skjult navn'))
  assert.ok(!html.includes('Skjult avsender'))
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

const buttonDestinations = {
  'article-target': {_id: 'article-target', slug: {current: 'intern-side'}},
  'file-target': {
    _id: 'file-target',
    url: 'https://cdn.sanity.io/files/test1234/production/document.pdf',
    originalFilename: 'Veiledning 2026.pdf',
  },
}
const buttonLinks = [
  {_key: 'internal', label: 'Intern side', linkType: 'internal', page: {_ref: 'article-target'}},
  {_key: 'external', label: 'Ekstern side', linkType: 'external', url: 'https://example.no'},
  {_key: 'file', label: 'Last ned veiledning', linkType: 'file', file: {asset: {_ref: 'file-target'}}},
]
const renderButton = (destinations, props = {}, appearance = 'secondary') =>
  renderToStaticMarkup(createElement(ArticleButton, {
    block: {_type: 'knapp', label: 'Velg tjeneste', appearance, destinations},
    destinationsById: buttonDestinations,
    isLoading: false,
    ...props,
  }))

test('one target navigates directly for all destination types and appearances', () => {
  for (const appearance of ['secondary', 'primary', 'mega']) {
    for (const link of buttonLinks) {
      const html = renderButton([link], {}, appearance)
      const expected = {
        internal: '/intern-side',
        external: 'https://example.no',
        file: `${buttonDestinations['file-target'].url}?dl=Veiledning%202026.pdf`,
      }[link.linkType]
      assert.ok(html.includes(`href="${expected}"`), html)
      assert.ok(!html.includes('<dialog'), html)
    }
  }
})

test('two or more targets render a modal trigger and ordered navigation tiles', () => {
  for (const appearance of ['secondary', 'primary', 'mega']) {
    for (const count of [2, 3]) {
      const html = renderButton(buttonLinks.slice(0, count), {}, appearance)
      assert.match(html, /<button[^>]*type="button"[^>]*>[\s\S]*?Velg tjeneste/)
      assert.match(html, /<dialog\b/)
      assert.equal((html.match(/<a\b/g) || []).length, count)
      const links = html.match(/<a\b[^>]*>/g) || []
      assert.ok(links.every((link) => /class="[^"]*navigationTile/.test(link)), html)
      assert.ok(!html.includes('linkGroup'), html)
      assert.ok(html.indexOf('Intern side') < html.indexOf('Ekstern side'), html)
      if (count === 3) {
        const fileTile = html.match(/<a\b[^>]*href="[^"]*\?dl=[^"]*"[\s\S]*?<\/a>/)?.[0]
        assert.ok(fileTile, html)
        assert.ok(!fileTile.includes('<svg'), fileTile)
      }
    }
  }
})

test('keeps legacy button destinations until an explicit replacement list is populated', () => {
  const legacy = {_type: 'knapp', label: 'Gammel knapp', linkType: 'external', url: 'https://old.no'}
  assert.deepEqual(getButtonLinks(legacy), [legacy])
  const empty = {...legacy, destinations: []}
  assert.deepEqual(getButtonLinks(empty), [empty])
  assert.deepEqual(getButtonLinks({...legacy, destinations: buttonLinks}), buttonLinks)
})

test('shows explicit empty, loading, missing-reference and error states without partial navigation', () => {
  assert.match(renderButton([]), /role="status"[^>]*>Legg til minst ett lenkemål/)
  assert.match(renderButton([{...buttonLinks[1], label: ''}]), /Legg til tekst/)
  assert.match(renderButton([{...buttonLinks[1], url: 'javascript:alert(1)'}]), /role="alert"/)
  for (const link of [buttonLinks[0], buttonLinks[2]]) {
    const loading = renderButton([link, buttonLinks[1]], {destinationsById: {}, isLoading: true})
    assert.match(loading, /role="status"[^>]*>Laster lenkemål/)
    assert.ok(!loading.includes('<button'), loading)
    const missing = renderButton([link], {destinationsById: {}})
    assert.match(missing, /role="alert"/)
    const failure = renderButton([link], {error: 'Nettverksfeil'})
    assert.match(failure, /Kunne ikke hente lenkemålet: Nettverksfeil/)
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
