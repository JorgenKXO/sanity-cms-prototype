import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {firstValueFrom, of} from 'rxjs'
import {createClient} from '@sanity/client'
import {ChevronDownIcon, LinkIcon, UlistIcon} from '@sanity/icons'
import {resolveConfig, validateDocument} from 'sanity'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = await mkdtemp(`${root}node_modules/.section-tests-`)
const iconSource = await readFile(new URL('../components/SectionIcons.tsx', import.meta.url), 'utf8')
const iconDefinitions = await readFile(
  new URL('../node_modules/@skatteetaten/ds-icons/src/SystemIcons/index.d.ts', import.meta.url),
  'utf8',
)
const iconExports = [...new Set(iconSource.match(/\b[A-Z][A-Za-z0-9]*Icon\b/g) || [])]
const iconModule = `import {jsx} from 'react/jsx-runtime'\n${
  iconExports.map((name) => `export const ${name} = () => jsx('svg', {})`).join('\n')
}`
after(() => rm(directory, {recursive: true, force: true}))
await build({
  stdin: {
    contents: `
      import {articleType} from './schemaTypes/articleType'
      import {pageSectionType, sectionPageType} from './schemaTypes/sectionPageType'
      import {defineType} from 'sanity'
      import {rettskilderPanelType} from './schemaTypes/panelTypes'
      import {
        articleTextContentBlockType, articleImageContentBlockType, articleInformationContentBlockType,
        articleButtonContentBlockType, articleOpenCloseContentBlockType,
        articleAccordionGroupContentBlockType,
        articleBlockquoteContentBlockType,
        articleExampleContentBlockType,
        articleLinkListContentBlockType,
      } from './schemaTypes/articleContentBlocks'
      import {sharedContentType} from './schemaTypes/sharedContentType'
      const navigationPageTestType = defineType({
        name: 'navigationPage',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      })
      export const schemaTypes = [
        articleType, pageSectionType, sectionPageType, rettskilderPanelType,
        articleTextContentBlockType, articleImageContentBlockType, articleInformationContentBlockType,
        articleButtonContentBlockType, articleOpenCloseContentBlockType, navigationPageTestType,
        articleAccordionGroupContentBlockType,
        articleBlockquoteContentBlockType,
        articleExampleContentBlockType,
        articleLinkListContentBlockType,
        sharedContentType,
      ]
    `,
    resolveDir: root,
    loader: 'ts',
  },
  outfile: `${directory}/schemas.mjs`,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  plugins: [{
    name: 'section-icon-stubs',
    setup(builder) {
      builder.onResolve({filter: /^@skatteetaten\/ds-icons$/}, () => ({
        path: 'section-icon-stubs',
        namespace: 'section-icon-stubs',
      }))
      builder.onLoad({filter: /.*/, namespace: 'section-icon-stubs'}, () => ({
        contents: iconModule,
        loader: 'js',
        resolveDir: root,
      }))
    },
  }],
})
const {schemaTypes} = await import(pathToFileURL(`${directory}/schemas.mjs`).href)
const [workspace] = await firstValueFrom(
  resolveConfig({
    projectId: 'test1234',
    dataset: 'production',
    auth: {
      state: of({
        authenticated: true,
        currentUser: null,
        client: createClient({
          projectId: 'test1234',
          dataset: 'production',
          apiVersion: '2026-09-10',
          useCdn: false,
        }),
      }),
    },
    schema: {
      // Slug uniqueness is a remote check, outside these offline validation tests.
      types: schemaTypes.map((type) => type.type !== 'document' ? type : {
        ...type,
        fields: type.fields.map((field) => field.type !== 'slug' ? field : {
          ...field, options: {...field.options, isUnique: () => true},
        }),
      }),
    },
  }),
)

const text = (key = 'text') => ({
  _key: key,
  _type: 'tekst',
  text: [
    {
      _key: 'paragraph',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: 'span', _type: 'span', text: 'Innhold', marks: []}],
    },
  ],
})
const section = (index) => ({
  _key: `section-${index}`,
  _type: 'pageSection',
  content: [text()],
})
const document = (sections) => ({
  _id: 'section-test',
  _type: 'sectionPage',
  _rev: 'test',
  _createdAt: '2026-10-14T00:00:00Z',
  _updatedAt: '2026-10-14T00:00:00Z',
  title: 'Seksjonsside',
  slug: {_type: 'slug', current: 'seksjonsside'},
  ingress: text().text,
  sections,
})
const errors = async (sections) =>
  (
    await validateDocument({
      document: document(sections),
      workspace,
      environment: 'cli',
    })
  ).filter((marker) => marker.level === 'error')

test('requires one to ten sections, including exact boundary values', async () => {
  for (const count of [1, 10]) {
    assert.deepEqual(await errors(Array.from({length: count}, (_, i) => section(i))), [])
  }
  for (const count of [0, 11]) {
    const result = await errors(Array.from({length: count}, (_, i) => section(i)))
    assert.ok(
      result.some((marker) => marker.path[0] === 'sections'),
      JSON.stringify(result),
    )
  }
  assert.ok((await errors(undefined)).some((marker) => marker.path[0] === 'sections'))
})

test('requires section content, but name, heading and icon are optional', async () => {
  assert.deepEqual(await errors([section(1)]), [])
  for (const content of [undefined, []]) {
    const result = await errors([{...section(1), content}])
    assert.ok(
      result.some((marker) => marker.path.includes('content')),
      JSON.stringify(result),
    )
  }
})

test('offers accordion groups and link lists on articles but not section pages', () => {
  const article = schemaTypes.find((type) => type.name === 'article')
  const sectionType = schemaTypes.find((type) => type.name === 'pageSection')
  const articleContent = article.fields.find((field) => field.name === 'content')
  const directArticleBlocks = articleContent.of.filter((block) => block.type !== 'reference')
  const sectionBlocks = sectionType.fields.find((field) => field.name === 'content').of
  const page = schemaTypes.find((type) => type.name === 'sectionPage')
  const sectionPageBuilder = page.fields.find((field) => field.name === 'sections')
  const iconField = sectionType.fields.find((field) => field.name === 'icon')
  const iconOptions = iconField.options.list
  assert.ok(directArticleBlocks.some((block) => block.type === 'accordionGroup'))
  assert.ok(directArticleBlocks.some((block) => block.type === 'lenkeliste'))
  assert.ok(directArticleBlocks.some((block) => block.type === 'eksempel'))
  assert.ok(!directArticleBlocks.some((block) => block.type === 'sitat'))
  assert.ok(articleContent.of.every((block) => block.name !== 'seksjon'))
  assert.deepEqual(
    sectionBlocks.map((block) => block.name || block.type),
    ['tekst', 'bilde', 'eksempel', 'informasjon', 'knapp', 'varsel', 'krise', 'rettskilderPanel', 'openClose'],
  )
  assert.ok(!sectionBlocks.some((block) => block.type === 'sitat'))
  assert.deepEqual(sectionPageBuilder.of.map((block) => block.type), ['pageSection'])
  assert.equal(sectionPageBuilder.components, undefined)
  assert.deepEqual(sectionType.options, {collapsible: true, collapsed: true})
  assert.equal(sectionType.preview.prepare({content: [{}]}).subtitle, 'Seksjon · 1 blokk')
  assert.equal(typeof iconField.components.input, 'function')
  const legacyValues = {
    Info: 'info',
    Completed: 'completed',
    Calendar: 'calendar',
    Clock: 'clock',
    Bell: 'bell',
    Lock: 'lock',
  }
  const expectedOptions = [...iconDefinitions.matchAll(/export \* from '\.\/([^']+)'/g)]
    .map(([, name]) => name)
    .filter((name) => !name.toLowerCase().includes('outline'))
    .map((name) => legacyValues[name] || name)
  assert.deepEqual(iconOptions.map(({value}) => value), expectedOptions)
})

test('defines link lists with a list icon and uncapped ordered Sanity page references', async () => {
  const type = schemaTypes.find((type) => type.name === 'lenkeliste')
  assert.equal(type.title, 'Lenkeliste')
  assert.equal(type.icon, UlistIcon)
  assert.deepEqual(type.fields.map((field) => field.name), ['heading', 'ingress', 'pages'])
  assert.equal(type.fields.find((field) => field.name === 'heading').validation, undefined)
  assert.equal(type.fields.find((field) => field.name === 'ingress').validation, undefined)
  const pages = type.fields.find((field) => field.name === 'pages')
  assert.equal(pages.type, 'array')
  const link = pages.of.find((member) => member.name === 'linkListItem')
  assert.equal(link.type, 'object')
  assert.deepEqual(link.fields.map((field) => field.name), ['page', 'label'])
  assert.deepEqual(link.fields.find((field) => field.name === 'page').to.map((target) => target.type), [
    'article', 'sectionPage', 'navigationPage',
  ])
  assert.ok(pages.of.some((member) => member.type === 'reference'))
  assert.equal(link.preview.prepare({label: 'Egen tekst', pageTitle: 'Original'}).title, 'Egen tekst')
  assert.equal(link.preview.prepare({label: ' ', pageTitle: 'Original'}).title, 'Original')
  assert.equal(type.preview.prepare({pages: [{}]}).subtitle, 'Lenkeliste · 1 lenke')
  assert.equal(type.preview.prepare({pages: [{}, {}]}).subtitle, 'Lenkeliste · 2 lenker')
  assert.equal(type.preview.prepare({heading: 'Relaterte sider'}).title, 'Relaterte sider')
  assert.equal(type.preview.prepare({blockName: 'Gammelt navn'}).title, 'Lenkeliste')

  const members = [{kind: 'item', key: 'legacy', item: {schemaType: {name: 'reference'}}}]
  const inputProps = {
    schemaType: {...pages, of: pages.of.map((member) => ({
      ...member, name: member.name || member.type,
    }))},
    members,
    value: [{_key: 'legacy', _type: 'reference', _ref: 'target'}],
    readOnly: true,
    onChange: () => {},
    renderDefault: (props) => props,
  }
  const rendered = pages.components.input(inputProps)
  assert.deepEqual(rendered.schemaType.of.map((member) => member.name), ['linkListItem'])
  assert.equal(rendered.members, members)
  assert.equal(rendered.value, inputProps.value)
  assert.equal(rendered.readOnly, true)
  assert.equal(rendered.onChange, inputProps.onChange)
  assert.equal(inputProps.schemaType.of.length, 2)

  const validate = async (value) => (await validateDocument({
    document: {
      ...document(undefined),
      _type: 'article',
      content: [value],
    },
    workspace,
    environment: 'cli',
    getDocumentExists: async () => true,
  })).filter((marker) => marker.level === 'error')
  const list = {_key: 'list', _type: 'lenkeliste'}
  for (const label of [undefined, '', ' ', 'Egen lenketekst']) {
    assert.deepEqual(await validate({
      ...list, heading: 'Relaterte sider', ingress: 'Her finner du mer informasjon.', pages: [{
        _key: 'link', _type: 'linkListItem',
        page: {_type: 'reference', _ref: 'target'}, label,
      }],
    }), [])
  }
  for (const count of [1, 100]) {
    assert.deepEqual(await validate({
      ...list,
      pages: Array.from({length: count}, (_, index) => ({
        _key: `page-${index}`, _type: 'reference', _ref: `target-${index}`,
      })),
    }), [])
  }
  for (const pages of [
    undefined, [], [{_key: 'empty', _type: 'reference'}],
    [{_key: 'empty', _type: 'linkListItem', label: 'Tekst uten side'}],
  ]) {
    const result = await validate({...list, pages})
    assert.ok(result.some((marker) => marker.path.includes('pages')), JSON.stringify(result))
  }
})

test('defines accordion groups with required nested accordions and no size setting', () => {
  const accordionGroup = schemaTypes.find((type) => type.name === 'accordionGroup')
  const accordionsField = accordionGroup.fields.find((field) => field.name === 'accordions')
  const accordion = accordionsField.of[0]

  assert.equal(accordionGroup.title, 'Accordion-gruppe')
  assert.equal(accordionGroup.fields.some((field) => field.name === 'size'), false)
  const showNumbers = accordionGroup.fields.find((field) => field.name === 'showNumbers')
  assert.equal(showNumbers.title, 'Vis med tall')
  assert.equal(showNumbers.type, 'boolean')
  assert.equal(showNumbers.initialValue, false)
  const content = accordion.fields.find((field) => field.name === 'content')
  assert.deepEqual(content.of.map((member) => member.type || member.name), ['block', 'openClose'])
  assert.match(content.description, /Åpne\/Lukke-objekter/)
  assert.deepEqual(
    accordion.fields.map((field) => field.name),
    ['title', 'content'],
  )
  assert.equal(accordionGroup.preview.prepare({accordions: [{}, {}]}).subtitle, '2 accordions')
  assert.equal(accordionGroup.preview.prepare({accordions: [{}]}).subtitle, '1 accordion')
  assert.equal(accordionsField.validation({required: () => ({min: () => 'validated'})}), 'validated')
})

test('supports OpenClose with a required heading and content and all three sizes', async () => {
  const openClose = {
    _key: 'open-close',
    _type: 'openClose',
    title: 'Les mer',
    size: 'medium',
    content: text().text,
  }
  const validateOpenClose = async (value) =>
    (
      await validateDocument({
        document: document([{...section(1), content: [value]}]),
        workspace,
        environment: 'cli',
      })
    ).filter((marker) => marker.level === 'error')

  assert.deepEqual(await validateOpenClose(openClose), [])
  for (const field of ['title', 'size', 'content']) {
    const result = await validateOpenClose({...openClose, [field]: undefined})
    assert.ok(result.some((marker) => marker.path.includes(field)), JSON.stringify(result))
  }

  const openCloseSchema = schemaTypes.find((type) => type.name === 'openClose')
  assert.equal(openCloseSchema.title, 'Åpne/Lukke')
  assert.equal(openCloseSchema.icon, ChevronDownIcon)
  assert.deepEqual(openCloseSchema.preview.prepare({size: 'medium'}), {
    title: 'Åpne/Lukke',
    subtitle: 'Åpne/Lukke · Middels',
  })
  assert.equal(openCloseSchema.preview.prepare({
    blockName: 'Internt navn', title: 'Les mer', size: 'small',
  }).title, 'Internt navn')
  assert.equal(openCloseSchema.preview.prepare({title: 'Les mer', size: 'large'}).title, 'Les mer')
  assert.deepEqual(
    openCloseSchema.fields.find((field) => field.name === 'size').options.list.map(({value}) => value),
    ['small', 'medium', 'large'],
  )
})

test('defines examples without a name or color field and validates rich text', async () => {
  const example = schemaTypes.find((type) => type.name === 'eksempel')
  assert.equal(example.title, 'Eksempel')
  assert.deepEqual(example.fields.map((field) => field.name), ['text'])
  const textField = example.fields[0]
  const textBlock = textField.of[0]
  assert.deepEqual(textBlock.styles.map(({title, value}) => [title, value]), [
    ['Normal', 'normal'],
    ['Underoverskrift (h2)', 'h2'],
    ['Underoverskrift (h3)', 'h3'],
  ])
  assert.deepEqual(textBlock.lists.map(({title, value}) => [title, value]), [
    ['Kulepunktliste', 'bullet'],
    ['Nummerert liste', 'number'],
  ])
  assert.deepEqual(textBlock.marks.decorators.map(({title, value}) => [title, value]), [
    ['Fet', 'strong'],
    ['Kursiv', 'em'],
  ])
  const pageLink = textBlock.marks.annotations[0]
  assert.equal(pageLink.name, 'pageLink')
  assert.equal(pageLink.title, 'Lenke')
  assert.equal(pageLink.icon, LinkIcon)
  assert.deepEqual(pageLink.fields[0].to.map((target) => target.type), [
    'article', 'sectionPage', 'navigationPage',
  ])
  assert.equal(pageLink.fields[0].validation({required: () => 'required'}), 'required')
  assert.equal(example.preview.prepare({blocks: text().text}).title, 'Innhold')
  assert.equal(example.preview.prepare({}).title, 'Eksempel')
  assert.equal(example.preview.prepare({}).subtitle, 'Eksempel')

  assert.deepEqual(await errors([{
    ...section(1),
    content: [{_key: 'example', _type: 'eksempel', text: text().text}],
  }]), [])
  const result = await errors([{
    ...section(1),
    content: [{_key: 'example', _type: 'eksempel', text: []}],
  }])
  assert.ok(result.some((marker) => marker.path.includes('text')), JSON.stringify(result))
})

test('requires button label and the selected link destination', async () => {
  const validButton = {
    _key: 'button',
    _type: 'knapp',
    label: 'Gå videre',
    appearance: 'secondary',
    linkType: 'internal',
    page: {_type: 'reference', _ref: 'article-target'},
  }
  const validateButton = async (button) =>
    (
      await validateDocument({
        document: document([{...section(1), content: [button]}]),
        workspace,
        environment: 'cli',
        getDocumentExists: async () => true,
      })
    ).filter((marker) => marker.level === 'error')

  assert.deepEqual(await validateButton(validButton), [])
  assert.ok((await validateButton({...validButton, label: undefined}))
    .some((marker) => marker.path.includes('label')))
  assert.ok((await validateButton({
    ...validButton,
    page: undefined,
  })).some((marker) => marker.path.includes('page')))
  for (const url of [undefined, 'https://example.no']) {
    assert.ok((await validateButton({...validButton, linkType: 'external', url}))
      .some((marker) => marker.path.includes('linkType')))
  }
})

test('validates mixed button targets, required destinations and uploaded file assets', async () => {
  const button = {
    _key: 'button', _type: 'knapp', label: 'Velg tjeneste', appearance: 'mega',
    destinations: [
      {_key: 'internal', _type: 'buttonDestination', label: 'Les mer', linkType: 'internal',
        page: {_type: 'reference', _ref: 'article-target'}},
      {_key: 'file', _type: 'buttonDestination', label: 'Last ned', linkType: 'file',
        file: {_type: 'file', asset: {_type: 'reference', _ref: 'file-test-pdf'}}},
    ],
  }
  const validate = async (value) => (await validateDocument({
    document: document([{...section(1), content: [value]}]),
    workspace,
    environment: 'studio',
    getDocumentExists: async () => true,
  })).filter((marker) => marker.level === 'error')

  assert.deepEqual(await validate(button), [])
  for (const target of button.destinations) {
    assert.deepEqual(await validate({...button, destinations: [target]}), [])
    for (const field of ['label', 'linkType', {
      internal: 'page', file: 'file',
    }[target.linkType]]) {
      const result = await validate({...button, destinations: [{...target, [field]: undefined}]})
      assert.ok(result.some((marker) => marker.path.includes(field)), `${target.linkType}.${field}: ${JSON.stringify(result)}`)
    }
  }
  for (const destinations of [undefined, []]) {
    assert.ok((await validate({...button, destinations}))
      .some((marker) => marker.path.includes('destinations')))
  }
  assert.ok((await validate({...button, destinations: [{
    ...button.destinations[1], file: {_type: 'file'},
  }]})).some((marker) => marker.path.includes('file')))
  assert.deepEqual(await validate({...button, linkType: 'internal'}), [])
  assert.deepEqual(await validate({...button, linkType: 'external', url: 'https://old.no'}), [])
  for (const url of [undefined, 'https://example.no']) {
    const external = {
      _key: 'external', _type: 'buttonDestination', label: 'Ekstern tjeneste', linkType: 'external', url,
    }
    for (const destinations of [[external], [...button.destinations, external]]) {
      const result = await validate({...button, destinations})
      assert.ok(result.some((marker) =>
        marker.path.includes('linkType') && marker.message.includes('Eksterne lenker er ikke lenger tillatt')),
      JSON.stringify(result))
    }
  }

  const type = schemaTypes.find((type) => type.name === 'knapp')
  const legacyField = type.fields.find((field) => field.name === 'linkType')
  assert.equal(legacyField.initialValue, undefined)
  assert.equal(legacyField.hidden({parent: button}), true)
  assert.equal(legacyField.hidden({parent: {linkType: 'external'}}), false)
  const destinationsField = type.fields.find((field) => field.name === 'destinations')
  const targetFields = destinationsField.of[0].fields
  assert.equal(targetFields[0].name, 'linkType')
  assert.equal(targetFields.at(-1).name, 'label')
  assert.equal(typeof destinationsField.of[0].components.input, 'function')
  assert.equal(legacyField.readOnly, true)
  assert.equal(legacyField.options, undefined)
  assert.deepEqual(targetFields.find((field) => field.name === 'linkType')
    .options.list.map((option) => option.value), ['internal', 'file'])
  for (const field of [type.fields, targetFields].map((fields) =>
    fields.find((field) => field.name === 'url'))) {
    assert.equal(field.readOnly, true)
    assert.ok(field.deprecated.reason)
  }
})

test('validates image alternative text inside sections', async () => {
  const image = {
    _key: 'image',
    _type: 'bilde',
    image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-test-10x10-png'}},
  }
  const validateImage = async (value) =>
    (
      await validateDocument({
        document: document([{...section(1), content: [value]}]),
        workspace,
        environment: 'cli',
        getDocumentExists: async () => true,
      })
    ).filter((marker) => marker.level === 'error')
  assert.ok((await validateImage(image)).some((marker) => marker.path.includes('alt')))
  assert.deepEqual(await validateImage({...image, isDecorative: true}), [])
  assert.deepEqual(await validateImage({...image, alt: 'Et bilde'}), [])
})

test('allows shared content directly in articles', async () => {
  const articleDocument = {
    ...document(undefined),
    _type: 'article',
    content: [text(), {_key: 'shared', _type: 'reference', _ref: 'shared-test'}],
  }
  const validateArticle = async (content) => (await validateDocument({
    document: {...articleDocument, content},
    workspace,
    environment: 'cli',
    getDocumentExists: async () => true,
  })).filter((marker) => marker.level === 'error')
  assert.deepEqual(await validateArticle(articleDocument.content), [])
  assert.deepEqual(await validateArticle([text()]), [])
})
