import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, rm} from 'node:fs/promises'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {firstValueFrom, of} from 'rxjs'
import {createClient} from '@sanity/client'
import {resolveConfig, validateDocument} from 'sanity'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = await mkdtemp(`${root}node_modules/.section-tests-`)
after(() => rm(directory, {recursive: true, force: true}))
await build({
  stdin: {
    contents: `
      import {articleType} from './schemaTypes/articleType'
      import {pageSectionType, sectionPageType} from './schemaTypes/sectionPageType'
      import {rettskilderPanelType} from './schemaTypes/panelTypes'
      export const schemaTypes = [articleType, pageSectionType, sectionPageType, rettskilderPanelType]
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

test('reuses all six article blocks and does not offer nested sections or shared content', () => {
  const article = schemaTypes.find((type) => type.name === 'article')
  const sectionType = schemaTypes.find((type) => type.name === 'pageSection')
  const articleBlocks = article.fields.find((field) => field.name === 'content').of
  const sectionBlocks = sectionType.fields.find((field) => field.name === 'content').of
  assert.equal(articleBlocks, sectionBlocks)
  assert.deepEqual(
    sectionBlocks.map((block) => block.name || block.type),
    ['tekst', 'bilde', 'informasjon', 'varsel', 'krise', 'rettskilderPanel'],
  )
  assert.equal(sectionType.options.collapsible, false)
  const page = schemaTypes.find((type) => type.name === 'sectionPage')
  assert.equal(
    typeof page.fields.find((field) => field.name === 'sections').components.input,
    'function',
  )
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
