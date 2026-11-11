import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {firstValueFrom, of} from 'rxjs'
import {createClient} from '@sanity/client'
import {ChevronDownIcon, LinkIcon, UlistIcon, WarningOutlineIcon} from '@sanity/icons'
import {resolveConfig, unset, validateDocument} from 'sanity'

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
      import {ContentBuilderInput} from './components/ContentBuilderInput'
      import {NavigationContentInput} from './components/NavigationContentInput'
      import {informasjonPanelType, rettskilderPanelType, varselPanelType} from './schemaTypes/panelTypes'
      import {
        articleTextContentBlockType, articleImageContentBlockType, articleInformationContentBlockType,
        articleButtonContentBlockType, articleOpenCloseContentBlockType,
        articleAccordionGroupContentBlockType,
        articleImageTextContentBlockType,
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
        articleType, pageSectionType, sectionPageType, rettskilderPanelType, informasjonPanelType, varselPanelType,
        articleTextContentBlockType, articleImageContentBlockType, articleInformationContentBlockType,
        articleButtonContentBlockType, articleOpenCloseContentBlockType, navigationPageTestType,
        articleAccordionGroupContentBlockType,
        articleImageTextContentBlockType,
        articleBlockquoteContentBlockType,
        articleExampleContentBlockType,
        articleLinkListContentBlockType,
        sharedContentType,
      ]
      export {ContentBuilderInput, NavigationContentInput}
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
const {schemaTypes, ContentBuilderInput, NavigationContentInput} = await import(
  pathToFileURL(`${directory}/schemas.mjs`).href,
)
test('hides the manually managed last-updated field from article and section pages', () => {
  for (const name of ['article', 'sectionPage']) {
    const type = schemaTypes.find((schemaType) => schemaType.name === name)
    assert.equal(type.fields.some((field) => field.name === 'updatedAt'), false)
  }
})
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
  heading: `Seksjon ${index}`,
  icon: 'info',
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

test('requires section heading, icon, and content', async () => {
  assert.deepEqual(await errors([section(1)]), [])

  for (const field of ['heading', 'icon', 'content']) {
    for (const value of [undefined, '']) {
      const result = await errors([{...section(1), [field]: value}])
      assert.ok(
        result.some((marker) => marker.path.includes(field)),
        `${field}=${JSON.stringify(value)}: ${JSON.stringify(result)}`,
      )
    }
  }

  const emptyContentErrors = await errors([{...section(1), content: []}])
  assert.ok(
    emptyContentErrors.some((marker) => marker.path.includes('content')),
    JSON.stringify(emptyContentErrors),
  )
})

test('supports the navigation-page highlighted intro on articles and section pages', async () => {
  for (const typeName of ['article', 'sectionPage']) {
    const type = schemaTypes.find((schemaType) => schemaType.name === typeName)
    const heroGroup = type.groups.find((group) => group.name === 'hero')
    const heroEnabled = type.fields.find((field) => field.name === 'heroEnabled')
    const heroBackgroundColor = type.fields.find((field) => field.name === 'heroBackgroundColor')
    const heroImage = type.fields.find((field) => field.name === 'heroImage')

    assert.equal(heroGroup.title, 'Fremhevet intro')
    assert.equal(heroEnabled.group, 'hero')
    assert.equal(heroEnabled.initialValue, false)
    assert.equal(heroBackgroundColor.initialValue, 'white')
    assert.equal(heroBackgroundColor.hidden({parent: {heroEnabled: false}}), true)
    assert.equal(heroBackgroundColor.hidden({parent: {heroEnabled: true}}), false)
    assert.equal(heroImage.hidden({parent: {heroEnabled: false}}), true)
    assert.equal(heroImage.hidden({parent: {heroEnabled: true}}), false)
    assert.deepEqual(
      heroBackgroundColor.options.list.map(({value}) => value),
      ['blue', 'green', 'yellow', 'white'],
    )
  }

  const validDocument = {
    ...document([section(1)]),
    heroEnabled: true,
    heroBackgroundColor: 'blue',
  }
  assert.deepEqual(
    (await validateDocument({document: validDocument, workspace, environment: 'cli'}))
      .filter((marker) => marker.level === 'error'),
    [],
  )

  const missingBackground = {
    ...validDocument,
    heroBackgroundColor: undefined,
  }
  const validationErrors = (await validateDocument({
    document: missingBackground,
    workspace,
    environment: 'cli',
  })).filter((marker) => marker.level === 'error')
  assert.ok(validationErrors.some((marker) => marker.path[0] === 'heroBackgroundColor'))
})

test('does not define optional editor names on content blocks', () => {
  for (const type of schemaTypes) {
    assert.equal(
      type.fields?.some((field) => field.name === 'blockName') || false,
      false,
      `${type.name} should not define an editor name field`,
    )
  }
})

test('hides shared content, crisis, and image-text blocks from content builder insert menus', () => {
  const article = schemaTypes.find((type) => type.name === 'article')
  const section = schemaTypes.find((type) => type.name === 'pageSection')

  for (const type of [article, section]) {
    const field = type.fields.find((item) => item.name === 'content')
    assert.equal(field.components.input, ContentBuilderInput)
    const contentType = workspace.schema.get(type.name).fields
      .find((item) => item.name === 'content').type
    const imageTextType = contentType.of.find((member) => member.name === 'bildeOgTekst')
    assert.ok(imageTextType)
    const existingMember = {
      kind: 'item',
      key: 'legacy-image-text',
      item: {schemaType: imageTextType},
      parentSchemaType: contentType,
    }
    const filtered = ContentBuilderInput({
      schemaType: contentType,
      members: [existingMember],
      renderDefault: (props) => props,
    })
    assert.ok(!filtered.schemaType.of.some((member) => member.name === 'krise'))
    assert.ok(!filtered.schemaType.of.some((member) => member.name === 'bildeOgTekst'))
    assert.ok(filtered.schemaType.of.some((member) => member.name === 'tekst'))
    assert.equal(filtered.members[0].item.schemaType, imageTextType)
    assert.equal(filtered.members[0].parentSchemaType, filtered.schemaType)
    assert.ok(
      !filtered.schemaType.of.some(
        (member) => 'to' in member && member.to.some((target) => target.name === 'sharedContent'),
      ),
    )
  }
})

test('hides crisis panels from navigation content insert menus', () => {
  const filtered = NavigationContentInput({
    schemaType: {
      of: [{name: 'informasjonPanel'}, {name: 'krisePanel'}],
    },
    members: [],
    renderDefault: (props) => props,
  })

  assert.deepEqual(filtered.schemaType.of.map((member) => member.name), ['informasjonPanel'])
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
  assert.ok(directArticleBlocks.some((block) => block.type === 'bildeOgTekst'))
  assert.ok(!directArticleBlocks.some((block) => block.type === 'sitat'))
  assert.ok(articleContent.of.every((block) => block.name !== 'seksjon'))
  assert.deepEqual(
    sectionBlocks.map((block) => block.name || block.type),
    ['tekst', 'bilde', 'bildeOgTekst', 'eksempel', 'informasjon', 'knapp', 'varsel', 'krise', 'rettskilderPanel', 'openClose'],
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

test('configures Regelverk panels with restricted text and link lists', () => {
  const panel = schemaTypes.find((type) => type.name === 'rettskilderPanel')
  const heading = panel.fields.find((field) => field.name === 'heading')
  const body = panel.fields.find((field) => field.name === 'body')
  const textBlock = body.of.find((member) => member.type === 'block')

  assert.equal(panel.title, 'Regelverk')
  assert.equal(heading.initialValue, 'Regelverk')
  assert.equal(panel.preview.prepare({}).title, 'Regelverk')
  assert.deepEqual(body.of.map((member) => member.type || member.name), ['block', 'lenkeliste'])
  assert.deepEqual(textBlock.styles.map(({value}) => value), ['normal', 'h3'])
  assert.deepEqual(textBlock.lists, [])
  assert.deepEqual(textBlock.marks.decorators, [])
  assert.deepEqual(textBlock.marks.annotations.map(({name}) => name), ['link'])
})

test('configures article text blocks without code, underline, or strikethrough', () => {
  const text = schemaTypes.find((type) => type.name === 'tekst')
  const field = text.fields.find((item) => item.name === 'text')
  const textBlock = field.of[0]

  assert.deepEqual(textBlock.styles.map(({title, value}) => [title, value]), [
    ['Normal', 'normal'],
    ['Underoverskrift (h2)', 'h2'],
    ['Underoverskrift (h3)', 'h3'],
  ])
  assert.deepEqual(textBlock.marks.decorators.map(({value}) => value), ['strong', 'em'])
  assert.deepEqual(textBlock.marks.annotations.map(({name}) => name), ['link'])
})

test('uses the section icon selector and restricted rich text in information panels', () => {
  const section = schemaTypes.find((type) => type.name === 'pageSection')
  const sectionIcon = section.fields.find((field) => field.name === 'icon')
  const informationPanel = schemaTypes.find((type) => type.name === 'informasjonPanel')
  const articleInformationPanel = schemaTypes.find((type) => type.name === 'informasjon')

  for (const [type, fieldName] of [
    [informationPanel, 'body'],
    [articleInformationPanel, 'text'],
  ]) {
    const icon = type.fields.find((field) => field.name === 'icon')
    assert.deepEqual(icon.options.list, sectionIcon.options.list)
    assert.equal(icon.components.input, sectionIcon.components.input)

    const field = type.fields.find((item) => item.name === fieldName)
    assert.deepEqual(
      field.of.map((member) => member.type || member.name),
      ['block', 'openClose', 'accordionGroup', 'knapp', 'lenkeliste'],
    )
    assert.deepEqual(
      field.of[0].styles.map(({value}) => value),
      ['normal', 'h2', 'h3'],
    )
    assert.deepEqual(
      field.of[0].lists.map(({value}) => value),
      ['bullet', 'number'],
    )
    assert.deepEqual(
      field.of[0].marks.decorators.map(({value}) => value),
      ['strong', 'em'],
    )
    assert.deepEqual(field.of[0].marks.annotations.map(({name}) => name), ['link'])
    const color = type.fields.find((item) => item.name === 'color')
    assert.deepEqual(color.options.list.map(({value}) => value), [
      'denim', 'forest', 'denim-outline', 'forest-outline',
    ])
  }
})

test('allows removing and reselecting icons in sections and both information panels', () => {
  for (const name of ['pageSection', 'informasjon', 'informasjonPanel']) {
    const type = schemaTypes.find((type) => type.name === name)
    const input = type.fields.find((field) => field.name === 'icon').components.input
    const patches = []
    const props = {id: 'icon', value: 'info', onChange: (patch) => patches.push(patch)}
    const rendered = input(props)
    const [remove, options] = rendered.props.menu.props.children
    assert.equal(remove.props.text, 'Ingen ikon')
    assert.equal(remove.props.pressed, false)
    remove.props.onClick()
    assert.deepEqual(patches, [unset()])
    options[0].props.onClick()
    assert.equal(patches[1].type, 'set')
    assert.equal(typeof patches[1].value, 'string')

    const empty = input({...props, value: undefined})
    assert.equal(empty.props.menu.props.children[0].props.pressed, true)
    const readOnly = input({...props, readOnly: true})
    assert.equal(readOnly.props.button.props.disabled, true)
    assert.equal(readOnly.props.menu.props.children[0].props.disabled, true)
    assert.ok(readOnly.props.menu.props.children[1].every((item) => item.props.disabled))
  }
})

test('warning panels reuse information content without accordions or appearance choices', () => {
  const information = schemaTypes.find((type) => type.name === 'informasjon')
  const expectedContent = information.fields.find((field) => field.name === 'text').of
    .filter((member) => member.type !== 'accordionGroup')
  const article = schemaTypes.find((type) => type.name === 'article')
  const warning = article.fields.find((field) => field.name === 'content').of
    .find((member) => member.name === 'varsel')
  const navigationWarning = schemaTypes.find((type) => type.name === 'varselPanel')

  for (const [type, fieldName] of [[warning, 'text'], [navigationWarning, 'body']]) {
    assert.equal(type.title, 'Varselspanel')
    assert.equal(type.icon, WarningOutlineIcon)
    assert.ok(!type.fields.some((field) => ['color', 'icon'].includes(field.name)))
    const field = type.fields.find((item) => item.name === fieldName)
    assert.deepEqual(field.of, expectedContent)
    assert.deepEqual(field.of.map((member) => member.type), [
      'block', 'openClose', 'knapp', 'lenkeliste',
    ])
    assert.equal(type.preview.prepare({}).title, 'Varselspanel')
    assert.equal(type.preview.prepare({title: 'Viktig frist'}).title, 'Viktig frist')
  }
})

test('configures the image and text block with required content and fixed color choices', async () => {
  const imageText = schemaTypes.find((type) => type.name === 'bildeOgTekst')
  const fields = imageText.fields
  const heading = fields.find((field) => field.name === 'heading')
  const image = fields.find((field) => field.name === 'image')
  const body = fields.find((field) => field.name === 'body')
  const color = fields.find((field) => field.name === 'color')

  assert.ok(heading.validation)
  assert.ok(image.validation)
  assert.equal(image.options.hotspot, true)
  assert.ok(body.validation)
  assert.deepEqual(body.of[0].styles.map((style) => style.value), ['normal'])
  assert.deepEqual(body.of[0].lists.map((list) => list.value), ['number', 'bullet'])
  assert.deepEqual(body.of[0].marks.decorators.map((decorator) => decorator.value), ['strong', 'em'])
  assert.deepEqual(body.of[0].marks.annotations.map((annotation) => annotation.name), ['link'])
  assert.equal(fields.some((field) => field.name === 'button'), false)
  assert.equal(color.options.layout, 'radio')
  assert.deepEqual(color.options.list.map((option) => option.value), [
    'denim-10', 'forest-10', 'ochre-10', 'graphite-10', 'burgundy-10',
  ])
  assert.equal(color.initialValue, 'denim-10')

  const validBlock = {
    _key: 'image-text',
    _type: 'bildeOgTekst',
    heading: 'Slik gjør du det',
    image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-test-10x10-png'}},
    alt: 'En person fyller ut et skjema',
    body: text().text,
    color: 'denim-10',
  }
  const validateBlock = async (block) =>
    await validateDocument({
      document: document([{...section(1), content: [block]}]),
      workspace,
      environment: 'cli',
      getDocumentExists: async () => true,
    })
  const blockErrors = async (block) =>
    (await validateBlock(block)).filter((marker) => marker.level === 'error')

  assert.deepEqual(await blockErrors(validBlock), [])
  const missingHeadingErrors = await blockErrors({...validBlock, heading: undefined})
  assert.ok(missingHeadingErrors.some((marker) => marker.path.includes('heading')))
  assert.ok(missingHeadingErrors.some((marker) => marker.message === 'Legg til en overskrift.'))
  const missingImageErrors = await validateBlock({...validBlock, image: undefined})
  assert.ok(
    missingImageErrors.some((marker) => marker.path.includes('image')),
    JSON.stringify(missingImageErrors),
  )
  assert.ok((await blockErrors({...validBlock, body: undefined}))
    .some((marker) => marker.path.includes('body')))
  assert.ok((await blockErrors({...validBlock, alt: undefined}))
    .some((marker) => marker.path.includes('alt')))
  assert.deepEqual(await blockErrors({...validBlock, isDecorative: true, alt: undefined}), [])
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

  assert.equal(accordionGroup.title, 'Trekkspill-gruppe')
  assert.equal(accordionGroup.fields.some((field) => field.name === 'size'), false)
  const showNumbers = accordionGroup.fields.find((field) => field.name === 'showNumbers')
  assert.equal(showNumbers.title, 'Vis med tall')
  assert.equal(showNumbers.type, 'boolean')
  assert.equal(showNumbers.initialValue, false)
  const ingress = accordion.fields.find((field) => field.name === 'ingress')
  assert.equal(ingress.title, 'Ingress')
  assert.equal(ingress.type, 'string')
  const content = accordion.fields.find((field) => field.name === 'content')
  assert.deepEqual(
    content.of.map((member) => member.type || member.name),
    ['block', 'informasjonPanel', 'openClose', 'bilde', 'eksempel', 'knapp', 'lenkeliste'],
  )
  assert.deepEqual(
    content.of[0],
    schemaTypes.find((type) => type.name === 'eksempel').fields[0].of[0],
  )
  assert.match(content.description, /samme formateringsvalg som Eksempel/)
  assert.deepEqual(
    accordion.fields.map((field) => field.name),
    ['title', 'ingress', 'content'],
  )
  assert.equal(accordionGroup.preview.prepare({accordions: [{}, {}]}).subtitle, '2 trekkspill')
  assert.equal(accordionGroup.preview.prepare({accordions: [{}]}).subtitle, '1 trekkspill')
  assert.equal(accordionsField.validation({required: () => ({min: () => 'validated'})}), 'validated')
})

test('supports OpenClose with required heading and content and no size setting', async () => {
  const openClose = {
    _key: 'open-close',
    _type: 'openClose',
    title: 'Les mer',
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
  for (const field of ['title', 'content']) {
    const result = await validateOpenClose({...openClose, [field]: undefined})
    assert.ok(result.some((marker) => marker.path.includes(field)), JSON.stringify(result))
  }

  const openCloseSchema = schemaTypes.find((type) => type.name === 'openClose')
  assert.equal(openCloseSchema.title, 'Åpne/Lukke')
  assert.equal(openCloseSchema.icon, ChevronDownIcon)
  assert.equal(openCloseSchema.fields.some((field) => field.name === 'size'), false)
  const openCloseContent = openCloseSchema.fields.find((field) => field.name === 'content')
  const accordionContent = schemaTypes
    .find((type) => type.name === 'accordionGroup')
    .fields.find((field) => field.name === 'accordions')
    .of[0]
    .fields.find((field) => field.name === 'content')
  assert.deepEqual(
    openCloseContent.of.map((member) => member.type || member.name),
    ['block', 'informasjonPanel', 'bilde', 'eksempel', 'knapp', 'lenkeliste'],
  )
  assert.deepEqual(
    openCloseContent.of.map((member) => member.type || member.name),
    accordionContent.of
      .filter((member) => member.type !== 'openClose')
      .map((member) => member.type || member.name),
  )
  assert.deepEqual(
    openCloseContent.of[0],
    schemaTypes.find((type) => type.name === 'eksempel').fields[0].of[0],
  )
  assert.deepEqual(openCloseContent.of[0], accordionContent.of[0])
  assert.match(openCloseContent.description, /samme formateringsvalg som trekkspill/)
  assert.deepEqual(openCloseSchema.preview.prepare({}), {
    title: 'Åpne/Lukke',
    subtitle: 'Åpne/Lukke',
  })
  assert.equal(openCloseSchema.preview.prepare({
    blockName: 'Internt navn', title: 'Les mer', size: 'small',
  }).title, 'Les mer')
  assert.equal(openCloseSchema.preview.prepare({title: 'Les mer', size: 'large'}).title, 'Les mer')
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

test('requires a single page or uploaded file and defaults to the link radio option', async () => {
  const button = {
    _key: 'button', _type: 'knapp', label: 'Velg tjeneste', appearance: 'mega',
    linkType: 'internal',
    page: {_type: 'reference', _ref: 'article-target'},
  }
  const validate = async (value) => (await validateDocument({
    document: document([{...section(1), content: [value]}]),
    workspace,
    environment: 'studio',
    getDocumentExists: async () => true,
  })).filter((marker) => marker.level === 'error')

  assert.deepEqual(await validate(button), [])
  const fileButton = {
    ...button, linkType: 'file', page: undefined,
    file: {_type: 'file', asset: {_type: 'reference', _ref: 'file-test-pdf'}},
  }
  assert.deepEqual(await validate(fileButton), [])
  for (const file of [undefined, {_type: 'file'}]) {
    assert.ok((await validate({...fileButton, file})).some((marker) => marker.path.includes('file')))
  }
  for (const page of [undefined, {_type: 'reference'}]) {
    assert.ok((await validate({...button, page})).some((marker) => marker.path.includes('page')))
  }
  for (const linkType of [undefined, 'external', 'invalid']) {
    assert.ok((await validate({...button, linkType})).some((marker) => marker.path.includes('linkType')))
  }

  const type = schemaTypes.find((type) => type.name === 'knapp')
  const linkType = type.fields.find((field) => field.name === 'linkType')
  assert.equal(linkType.initialValue, 'internal')
  assert.equal(linkType.options.layout, 'radio')
  assert.notEqual(linkType.readOnly, true)
  assert.deepEqual(linkType.options.list, [
    {title: 'Lenke', value: 'internal'}, {title: 'Fil', value: 'file'},
  ])
  assert.equal(typeof type.components.input, 'function')
  const destinationsField = type.fields.find((field) => field.name === 'destinations')
  assert.equal(destinationsField.hidden, true)
  assert.equal(destinationsField.readOnly, true)
  assert.ok((await validate({
    ...button,
    destinations: [
      {_key: 'first', _type: 'buttonDestination', linkType: 'internal', page: button.page},
      {_key: 'second', _type: 'buttonDestination', linkType: 'file', file: fileButton.file},
    ],
  })).some((marker) => marker.path.includes('destinations')))
  for (const [fieldName, selectedType] of [['page', 'internal'], ['file', 'file']]) {
    const field = type.fields.find((field) => field.name === fieldName)
    assert.equal(field.hidden({parent: {linkType: selectedType}}), false)
    assert.equal(field.hidden({parent: {linkType: selectedType === 'file' ? 'internal' : 'file'}}), true)
  }
  const url = type.fields.find((field) => field.name === 'url')
  assert.equal(url.readOnly, true)
  assert.ok(url.deprecated.reason)
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
