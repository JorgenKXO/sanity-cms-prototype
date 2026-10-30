import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, rm} from 'node:fs/promises'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {firstValueFrom, of} from 'rxjs'
import {createClient} from '@sanity/client'
import {ChevronDownIcon} from '@sanity/icons'
import {resolveConfig, validateDocument} from 'sanity'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = await mkdtemp(`${root}node_modules/.section-tests-`)
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

test('offers the accordion group on articles but not section pages', () => {
  const article = schemaTypes.find((type) => type.name === 'article')
  const sectionType = schemaTypes.find((type) => type.name === 'pageSection')
  const directArticleBlocks = article.fields.find((field) => field.name === 'content').of
    .filter((block) => block.name !== 'seksjon' && block.type !== 'reference')
  const articleBlocks = article.fields.find((field) => field.name === 'content').of
    .find((block) => block.name === 'seksjon').fields
    .find((field) => field.name === 'content').of.filter((block) => block.type !== 'reference')
  const sectionBlocks = sectionType.fields.find((field) => field.name === 'content').of
  assert.ok(directArticleBlocks.some((block) => block.type === 'accordionGroup'))
  assert.ok(articleBlocks.some((block) => block.type === 'accordionGroup'))
  assert.deepEqual(
    articleBlocks.map((block) => block.type === 'accordionGroup' ? block.type : block.name || block.type),
    [...sectionBlocks.map((block) => block.name || block.type), 'accordionGroup'],
  )
  assert.deepEqual(
    sectionBlocks.map((block) => block.name || block.type),
    ['tekst', 'bilde', 'sitat', 'informasjon', 'knapp', 'varsel', 'krise', 'rettskilderPanel', 'openClose'],
  )
  assert.equal(sectionType.options.collapsible, false)
  const page = schemaTypes.find((type) => type.name === 'sectionPage')
  assert.equal(
    typeof page.fields.find((field) => field.name === 'sections').components.input,
    'function',
  )
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

test('requires quote content but allows an optional source and default border color', async () => {
  const quote = {_key: 'quote', _type: 'sitat', text: text().text}
  assert.deepEqual(await errors([{...section(1), content: [quote]}]), [])
  assert.deepEqual(await errors([{
    ...section(1), content: [{...quote, source: 'Skatteetaten', borderColor: 'forest'}],
  }]), [])
  for (const content of [undefined, []]) {
    const result = await errors([{
      ...section(1), content: [{...quote, text: content}],
    }])
    assert.ok(result.some((marker) => marker.path.includes('text')), JSON.stringify(result))
  }
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

test('keeps article section blocks and shared content without allowing mixed top-level content', async () => {
  const articleDocument = {
    ...document(undefined),
    _type: 'article',
    content: [{
      _key: 'article-section', _type: 'seksjon',
      content: [text(), {_key: 'shared', _type: 'reference', _ref: 'shared-test'}],
    }],
  }
  const validateArticle = async (content) => (await validateDocument({
    document: {...articleDocument, content},
    workspace,
    environment: 'cli',
    getDocumentExists: async () => true,
  })).filter((marker) => marker.level === 'error')
  assert.deepEqual(await validateArticle(articleDocument.content), [])
  assert.deepEqual(await validateArticle([text()]), [])
  assert.ok((await validateArticle([...articleDocument.content, text('other')]))
    .some((marker) => marker.path[0] === 'content'))
})
