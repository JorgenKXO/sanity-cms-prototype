import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react'
import {Accordion, OpenClose} from '@skatteetaten/ds-collections'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel, type PanelColor} from '@skatteetaten/ds-content'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Blockquote, Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import {HighlightedIntro} from './HighlightedIntro'
import {InformasjonPanel} from './InformasjonPanel'
import {withAlignmentOffset} from './panelUtilities'
import {SectionSignIcon} from './SectionSignIcon'
import {sectionIconMap} from '../components/SectionIcons'
import './numberedAccordion.css'
import './openClose.css'
import {ArticleButton, type ArticleButtonBlock, type ButtonDestination} from './ArticleButton'
import {ArticleLinkList, type ArticleLinkListBlock} from './ArticleLinkList'

type Breadcrumb = {
  _key?: string
  label?: string
  href?: string
}

type TekstBlock = {
  _key?: string
  _type: 'tekst'
  text?: PortableTextBlock[]
}

type BildeBlock = {
  _key?: string
  _type: 'bilde'
  image?: SanityImageSource
  alt?: string
  isDecorative?: boolean
}

type InformasjonBlock = {
  _key?: string
  _type: 'informasjon'
  heading?: string
  color?: string
  icon?: string
  text?: PortableTextBlock[]
}

type InformasjonPanelBlock = {
  _key?: string
  _type: 'informasjonPanel'
  heading?: string
  color?: string
  icon?: string
  body?: PortableTextBlock[]
}

type ArticleOpenCloseBlock = {
  _key?: string
  _type: 'openClose'
  title?: string
  content?: PortableTextBlock[]
}

type ArticleAccordionGroupBlock = {
  _key?: string
  _type: 'accordionGroup'
  showNumbers?: boolean
  accordions?: {
    _key?: string
    _type?: 'accordion'
    title?: string
    ingress?: string
    content?: PortableTextBlock[]
  }[]
}

type BildeOgTekstBlock = {
  _key?: string
  _type: 'bildeOgTekst'
  heading?: string
  image?: SanityImageSource
  alt?: string
  isDecorative?: boolean
  body?: PortableTextBlock[]
  color?: 'denim-10' | 'forest-10' | 'ochre-10' | 'graphite-10' | 'burgundy-10'
}

type BlockquoteBlock = {
  _key?: string
  _type: 'sitat'
  text?: PortableTextBlock[]
  source?: string
  borderColor?: 'ochre' | 'forest' | 'denim' | 'graphite'
}

type ExampleBlock = {
  _key?: string
  _type: 'eksempel'
  text?: PortableTextBlock[]
}

type PanelBlock = {
  _key?: string
  _type: 'varsel' | 'krise'
  heading?: string
  text?: PortableTextBlock[]
}

type RettskilderPanelBlock = {
  _key?: string
  _type: 'rettskilderPanel'
  heading?: string
  body?: PortableTextBlock[]
}

type SharedContentBlock = TekstBlock | BildeBlock | InformasjonBlock
type SharedContentReference = {_key?: string; _type: 'reference'; _ref: string}
type InnholdBlock =
  | SharedContentBlock
  | InformasjonPanelBlock
  | BildeOgTekstBlock
  | BlockquoteBlock
  | ExampleBlock
  | ArticleButtonBlock
  | ArticleLinkListBlock
  | ArticleOpenCloseBlock
  | ArticleAccordionGroupBlock
  | PanelBlock
  | RettskilderPanelBlock
  | SharedContentReference

type SeksjonBlock = {
  _key?: string
  _type: 'seksjon'
  heading?: string
  icon?: string
  content?: InnholdBlock[]
}

type ArticleContentBlock = InnholdBlock | SeksjonBlock

type SharedContentDocument = {
  _id: string
  title?: string
  content?: SharedContentBlock[]
}

export type ArticleDocument = {
  title?: string
  ingress?: PortableTextBlock[]
  heroEnabled?: boolean
  heroBackgroundColor?: string
  heroImage?: SanityImageSource
  breadcrumbs?: Breadcrumb[]
  content?: ArticleContentBlock[]
  updatedAt?: string
  sections?: {
    _key: string
    heading?: string
    icon?: string
    content?: InnholdBlock[]
  }[]
}

const panelTitle: Record<PanelBlock['_type'], string> = {
  varsel: 'Varselspanel',
  krise: 'Krise',
}

const imageTextPanelColors: Record<NonNullable<BildeOgTekstBlock['color']>, PanelColor> = {
  'denim-10': 'denim',
  'forest-10': 'forest',
  'ochre-10': 'ochre',
  'graphite-10': 'graphite',
  'burgundy-10': 'burgundy',
}

export type ArticlePreviewProps = {
  document?: {
    displayed?: ArticleDocument
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString(value: Record<string, unknown>, key: string) {
  return typeof value[key] === 'string' ? value[key] : undefined
}

function getDestinationIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(getDestinationIds)
  }
  if (!isRecord(value)) {
    return []
  }

  if (getString(value, '_type') === 'pageLink') {
    const page = value.page
    const id = isRecord(page) ? getString(page, '_ref') : undefined
    return id ? [id] : []
  }

  if (getString(value, '_type') === 'block') {
    return getDestinationIds(value.markDefs)
  }

  if (getString(value, '_type') === 'knapp') {
    const links = Array.isArray(value.destinations) && value.destinations.length
      ? value.destinations.slice(0, 1)
      : [value]
    return links.flatMap((link) => {
      if (!isRecord(link)) return []
      const linkType = getString(link, 'linkType')
      const page = link.page
      const file = link.file
      const asset = isRecord(file) ? file.asset : undefined
      const id = linkType === 'internal' && isRecord(page)
        ? getString(page, '_ref')
        : linkType === 'file' && isRecord(asset) ? getString(asset, '_ref') : undefined
      return id ? [id] : []
    })
  }

  if (getString(value, '_type') === 'lenkeliste') {
    const pages = Array.isArray(value.pages) ? value.pages : []
    return pages.flatMap((item) => {
      if (!isRecord(item)) return []
      const page = getString(item, '_type') === 'linkListItem' ? item.page : item
      const id = isRecord(page) ? getString(page, '_ref') : undefined
      return id ? [id] : []
    })
  }

  return ['content', 'accordions', 'text', 'body'].flatMap((key) =>
    getDestinationIds(value[key]),
  )
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100%',
    background: 'var(--semantic-page-background)',
    color: 'var(--semantic-page-foreground)',
  },
  page: {
    maxWidth: 'var(--semantic-responsive-wide-content)',
    margin: '0 auto',
    padding: 'var(--spacing-xl) var(--spacing-m) var(--spacing-mega)',
  },
  article: {
    maxWidth: 'var(--semantic-responsive-article)',
  },
  sectionPageSection: {
    borderTop: '2px solid var(--palette-forest-50)',
    padding: 'var(--spacing-xxl) 0 var(--spacing-l)',
    display: 'flex',
    gap: 'var(--spacing-xl)',
    alignItems: 'flex-start',
  },
  empty: {
    padding: 'var(--spacing-xl)',
  },
  section: {
    borderTop: '2px solid var(--palette-forest-50)',
    padding: 'var(--spacing-xxl) 0 var(--spacing-l)',
    display: 'flex',
    gap: 'var(--spacing-xl)',
    alignItems: 'flex-start',
  },
  sectionLast: {
    borderBottom: '2px solid var(--palette-forest-50)',
  },
  sectionIcon: {
    flex: '0 0 3.5rem',
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '50%',
    background: 'var(--palette-graphite-100)',
    color: 'var(--palette-graphite-0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBody: {
    flex: '1 1 0',
    minWidth: 0,
  },
  image: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    margin: 'var(--spacing-m) 0',
    borderRadius: '4px',
  },
}

const components = {
  block: {
    normal: ({children}) => <Paragraph hasSpacing>{children}</Paragraph>,
    h2: ({children}) => (
      <Heading as="h2" level={2}>
        {children}
      </Heading>
    ),
    h3: ({children}) => (
      <Heading as="h3" level={3}>
        {children}
      </Heading>
    ),
  },
  marks: {
    link: ({children, value}) => {
      const href = isRecord(value) ? getString(value, 'href') || '#' : '#'

      return <Link href={href}>{String(children)}</Link>
    },
  },
  list: {
    bullet: ({children}) => (
      <List as="ul" hasSpacing>
        {children}
      </List>
    ),
    number: ({children}) => (
      <List as="ol" hasSpacing>
        {children}
      </List>
    ),
  },
  listItem: {
    bullet: ({children}) => <List.Element>{children}</List.Element>,
    number: ({children}) => <List.Element>{children}</List.Element>,
  },
  types: {
    openClose: ({value}) => {
      const title = getString(value, 'title')
      if (!title) {
        return <p role="status">Legg til en overskrift for å forhåndsvise Åpne/Lukke.</p>
      }

      const content = Array.isArray(value.content)
        ? value.content as PortableTextBlock[]
        : undefined
      return (
        <OpenClose
          title={title}
          size="large"
          titleAs="h3"
          iconPosition="left"
          className="article-open-close"
        >
          {content ? (
            <PortableText value={content} components={components} />
          ) : (
            <p role="status">Legg til innhold i Åpne/Lukke.</p>
          )}
        </OpenClose>
      )
    },
  },
} satisfies PortableTextComponents

// Ingressen tillater kun lenker, ingen annen formatering – egen renderer uten overskrifter/lister.
const ingressComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => (
      <Paragraph variant="ingress" hasSpacing>
        {children}
      </Paragraph>
    ),
  },
  marks: {
    link: ({children, value}) => {
      const href = isRecord(value) ? getString(value, 'href') || '#' : '#'

      return <Link href={href}>{String(children)}</Link>
    },
  },
}

export function ArticlePreview(props: ArticlePreviewProps & {isSectionPage?: boolean}) {
  const article = props.document?.displayed
  const client = useClient({apiVersion: '2026-09-10'})
  const builder = imageUrlBuilder(client)
  const [sharedContentById, setSharedContentById] = useState<Record<string, SharedContentDocument>>({})
  const [sharedContentError, setSharedContentError] = useState<string>()
  const [isLoadingSharedContent, setIsLoadingSharedContent] = useState(false)
  const [destinationsById, setDestinationsById] = useState<Record<string, ButtonDestination>>({})
  const [destinationError, setDestinationError] = useState<string>()
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false)

  const sharedContentIds = [
    ...new Set(
      (article?.content || [])
        .flatMap((block) => (block._type === 'seksjon' ? block.content || [] : [block]))
        .filter((block): block is SharedContentReference => block._type === 'reference')
        .map((reference) => reference._ref),
    ),
  ]
  const sharedContentIdsKey = JSON.stringify(sharedContentIds)

  const contentBlocks = props.isSectionPage
    ? (article?.sections || []).flatMap((section) => section.content || [])
    : (article?.content || []).flatMap((block) =>
        block._type === 'seksjon' ? block.content || [] : [block],
      )

  const destinationIds = [...new Set(contentBlocks.flatMap(getDestinationIds))]
  const destinationIdsKey = JSON.stringify(destinationIds)

  useEffect(() => {
    if (sharedContentIds.length === 0) {
      setSharedContentById({})
      setSharedContentError(undefined)
      setIsLoadingSharedContent(false)
      return
    }

    let cancelled = false
    setSharedContentById({})
    setIsLoadingSharedContent(true)
    setSharedContentError(undefined)
    client
      .withConfig({perspective: 'drafts'})
      .fetch<SharedContentDocument[]>(
        `*[_id in $ids]{_id, title, content}`,
        {ids: sharedContentIds},
      )
      .then((results) => {
        if (cancelled) return
        setSharedContentById(Object.fromEntries(results.map((result) => [result._id, result])))
        setIsLoadingSharedContent(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSharedContentById({})
        setSharedContentError(error instanceof Error ? error.message : 'Ukjent feil')
        setIsLoadingSharedContent(false)
      })

    return () => {
      cancelled = true
    }
    // Keep the request stable while Sanity recreates the reference array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, sharedContentIdsKey])

  useEffect(() => {
    if (destinationIds.length === 0) {
      setDestinationsById({})
      setDestinationError(undefined)
      setIsLoadingDestinations(false)
      return
    }

    let cancelled = false
    setDestinationsById({})
    setDestinationError(undefined)
    setIsLoadingDestinations(true)
    client
      .withConfig({perspective: 'drafts'})
      .fetch<ButtonDestination[]>(
        `*[_id in $ids]{_id, title, slug, url, originalFilename}`,
        {ids: destinationIds},
      )
      .then((results) => {
        if (cancelled) return
        setDestinationsById(Object.fromEntries(results.map((result) => [result._id, result])))
        setIsLoadingDestinations(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setDestinationsById({})
        setDestinationError(error instanceof Error ? error.message : 'Ukjent feil')
        setIsLoadingDestinations(false)
      })

    return () => {
      cancelled = true
    }
    // Keep the request stable while Sanity recreates the reference array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, destinationIdsKey])

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []
  const breadcrumbTrail = breadcrumbs.length > 0 ? (
    <Breadcrumbs>
      <Breadcrumbs.List showLastItemAsCurrentPage>
        {breadcrumbs.map((item) => (
          <Breadcrumbs.Item key={item._key || item.label}>
            <Breadcrumbs.Link href={item.href || '#'}>{item.label || ''}</Breadcrumbs.Link>
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs.List>
    </Breadcrumbs>
  ) : null
  const heroImageSrc = article.heroImage
    ? builder.image(article.heroImage).width(400).fit('max').auto('format').url()
    : undefined

  function renderContentBlock(
    block: InnholdBlock,
    nested = false,
    informationPanelInDisclosure = false,
  ) {
    if (block._type === 'reference') {
      const sharedContent = sharedContentById[block._ref]
      if (!sharedContent) {
        return sharedContentError
          ? null
          : (
              <p role="status">
                {isLoadingSharedContent
                  ? 'Laster delt innhold …'
                  : 'Referert delt innhold ble ikke funnet.'}
              </p>
            )
      }

      return sharedContent.content?.map((sharedBlock, index) => (
        <div key={sharedBlock._key || `${sharedContent._id}-${index}`}>
          {renderContentBlock(sharedBlock, nested)}
        </div>
      ))
    }

    const baseContentComponents: PortableTextComponents = nested
      ? {
          ...components,
          block: {
            ...components.block,
            h2: ({children}) => (
              <Heading as="h3" level={3}>
                {children}
              </Heading>
            ),
            h3: ({children}) => (
              <Heading as="h4" level={3}>
                {children}
              </Heading>
            ),
          },
        }
      : components
    const pageLinkMarks = {
      pageLink: ({children, text, value}) => {
        const page = isRecord(value) && isRecord(value.page) ? value.page : undefined
        const pageId = page ? getString(page, '_ref') : undefined
        if (!pageId) {
          return <span role="alert">{children} (Lenkemålet mangler en side.)</span>
        }
        if (destinationError) {
          return <span role="alert">{children} (Kunne ikke hente lenkemålet: {destinationError})</span>
        }

        const destination = destinationsById[pageId]
        const slug = destination?.slug?.current
        if (!slug) {
          return (
            <span role={isLoadingDestinations ? 'status' : 'alert'}>
              {children} ({isLoadingDestinations
                ? 'Laster lenkemål …'
                : 'Lenkemålet ble ikke funnet eller mangler nettadresse.'})
            </span>
          )
        }

        return <Link href={`/${slug}`}>{text}</Link>
      },
    } satisfies NonNullable<PortableTextComponents['marks']>
    const renderEmbeddedBlock = (value: unknown, isInformationPanelInDisclosure = false) => {
      if (!isRecord(value)) return null
      switch (getString(value, '_type')) {
        case 'informasjonPanel':
        case 'openClose':
        case 'bilde':
        case 'eksempel':
        case 'knapp':
        case 'lenkeliste':
          return renderContentBlock(
            value as InnholdBlock,
            nested,
            isInformationPanelInDisclosure,
          )
        default:
          return null
      }
    }
    const contentComponents: PortableTextComponents = {
      ...baseContentComponents,
      marks: {...baseContentComponents.marks, ...pageLinkMarks},
      types: {
        ...baseContentComponents.types,
        bilde: ({value}) => renderEmbeddedBlock(value),
        eksempel: ({value}) => renderEmbeddedBlock(value),
        knapp: ({value}) => renderEmbeddedBlock(value),
        lenkeliste: ({value}) => renderEmbeddedBlock(value),
        openClose: ({value}) => renderEmbeddedBlock(value),
        informasjonPanel: ({value}) => renderEmbeddedBlock(value, true),
      },
    }
    const panelComponents: PortableTextComponents = nested
      ? {
          ...components,
          block: {
            ...components.block,
            h3: ({children}) => (
              <Heading as="h4" level={3}>
                {children}
              </Heading>
            ),
          },
        }
      : components
    const embeddedPanelComponents: PortableTextComponents = {
      ...panelComponents,
      types: {
        ...panelComponents.types,
        lenkeliste: ({value}) => renderEmbeddedBlock(value),
      },
    }
    if (block._type === 'tekst') {
      return block.text ? <PortableText value={block.text} components={contentComponents} /> : null
    }

    if (block._type === 'informasjonPanel') {
      return (
        <InformasjonPanel
          heading={block.heading}
          color={block.color}
          icon={block.icon}
          body={block.body}
          titleAs={nested || informationPanelInDisclosure ? 'h3' : 'h2'}
          stackedIcon={informationPanelInDisclosure}
          destinationContext={{
            destinationsById,
            error: destinationError,
            isLoading: isLoadingDestinations,
          }}
        />
      )
    }

    if (block._type === 'openClose') {
      if (!block.title) {
        return <p role="status">Legg til en overskrift for å forhåndsvise Åpne/Lukke.</p>
      }

      return (
        <OpenClose
          title={block.title}
          size="large"
          titleAs={nested ? 'h3' : 'h2'}
          iconPosition="left"
          className="article-open-close"
        >
          {block.content ? (
            <PortableText value={block.content} components={contentComponents} />
          ) : (
            <p role="status">Legg til innhold i Åpne/Lukke.</p>
          )}
        </OpenClose>
      )
    }

    if (block._type === 'accordionGroup') {
      if (!block.accordions?.length) {
        return <p role="status">Legg til minst én accordion for å forhåndsvise gruppen.</p>
      }

      const items = block.accordions.map((accordion, index) => {
        const item = accordion.title ? (
          <Accordion.Item
            key={accordion._key || index}
            title={accordion.title}
            subtitle={accordion.ingress}
            titleAs={nested ? 'h3' : 'h2'}
          >
            {accordion.content ? (
              <PortableText value={accordion.content} components={contentComponents} />
            ) : (
              <p role="status">Legg til innhold i accordionen.</p>
            )}
          </Accordion.Item>
        ) : (
          <p key={accordion._key || index} role="status">
            Legg til en overskrift for å forhåndsvise accordionen.
          </p>
        )

        return block.showNumbers ? (
          <div key={accordion._key || index} role="listitem" className="numbered-accordion-row">
            <span className="numbered-accordion-marker">{index + 1}</span>
            {item}
          </div>
        ) : item
      })

      return (
        <Accordion size="large" className="article-accordion-group">
          {block.showNumbers ? <div role="list">{items}</div> : items}
        </Accordion>
      )
    }

    if (block._type === 'bildeOgTekst') {
      const color = block.color || 'denim-10'
      const imageSource = block.image
        ? builder.image(block.image).width(960).fit('max').auto('format').url()
        : undefined

      return (
        <div className="image-text-panel-wrapper">
          <Panel
            title={block.heading || 'Bilde og tekst'}
            titleAs={nested ? 'h3' : 'h2'}
            color={imageTextPanelColors[color] || 'denim'}
            variant="filled"
            padding="m"
            spacing="l"
            imageSource={imageSource}
            imageSourceAltText={block.isDecorative ? '' : block.alt || ''}
            className={
              color === 'graphite-10'
                ? 'image-text-panel image-text-panel-graphite'
                : 'image-text-panel'
            }
          >
            {block.body ? <PortableText value={block.body} components={contentComponents} /> : null}
          </Panel>
        </div>
      )
    }

    if (block._type === 'bilde') {
      if (!block.image) {
        return null
      }
      const src = builder.image(block.image).width(960).fit('max').auto('format').url()
      return <img src={src} alt={block.isDecorative ? '' : block.alt || ''} style={styles.image} />
    }

    if (block._type === 'sitat') {
      if (!block.text?.length) return null

      return (
        <>
          <Blockquote borderColor={block.borderColor || 'ochre'} hasSpacing>
            <PortableText value={block.text} components={contentComponents} />
          </Blockquote>
          {block.source ? <Paragraph hasSpacing>{block.source}</Paragraph> : null}
        </>
      )
    }

    if (block._type === 'eksempel') {
      if (!block.text?.length) {
        return <p role="status">Legg til innhold for å forhåndsvise eksempelet.</p>
      }

      const exampleComponents: PortableTextComponents = {
        ...components,
        marks: {...components.marks, ...pageLinkMarks},
      }

      return (
        <Blockquote borderColor="ochre" hasSpacing>
          <PortableText value={block.text} components={exampleComponents} />
        </Blockquote>
      )
    }

    if (block._type === 'knapp') {
      return (
        <ArticleButton
          block={block}
          destinationsById={destinationsById}
          error={destinationError}
          isLoading={isLoadingDestinations}
        />
      )
    }

    if (block._type === 'lenkeliste') {
      return (
        <ArticleLinkList
          block={block}
          destinationsById={destinationsById}
          error={destinationError}
          isLoading={isLoadingDestinations}
          nested={nested}
        />
      )
    }

    if (block._type === 'rettskilderPanel') {
      return (
        <Panel
          title={block.heading || 'Regelverk'}
          titleAs={nested ? 'h3' : 'h2'}
          color="graphite"
          variant="filled"
          padding="m"
          spacing="l"
          renderIcon={() => withAlignmentOffset(<SectionSignIcon />)}
        >
          {block.body ? <PortableText value={block.body} components={embeddedPanelComponents} /> : null}
        </Panel>
      )
    }

    if (block._type === 'informasjon' || block._type === 'varsel') {
      return (
        <InformasjonPanel
          kind={block._type}
          heading={block.heading}
          color={block._type === 'informasjon' ? block.color : undefined}
          icon={block._type === 'informasjon' ? block.icon : undefined}
          body={block.text}
          titleAs={nested ? 'h3' : 'h2'}
          destinationContext={{
            destinationsById,
            error: destinationError,
            isLoading: isLoadingDestinations,
          }}
        />
      )
    }

    // "varsel" eller "krise"
    const appearance = fixedPanelAppearance[block._type as keyof typeof fixedPanelAppearance]
    if (!appearance) {
      return <p role="status">Denne innholdsblokken kan ikke forhåndsvises.</p>
    }
    const Icon = appearance.icon

    return (
      <Panel
        title={block.heading || panelTitle[block._type]}
        titleAs={nested ? 'h3' : 'h2'}
        color={appearance.color}
        variant={appearance.variant}
        padding="m"
        spacing="l"
        renderIcon={Icon ? () => withAlignmentOffset(<Icon />) : undefined}
      >
        {block.text ? <PortableText value={block.text} components={panelComponents} /> : null}
      </Panel>
    )
  }

  function renderTopLevelBlock(block: ArticleContentBlock, isLastSection: boolean) {
    if (block._type !== 'seksjon') {
      return renderContentBlock(block)
    }

    const Icon = block.icon ? sectionIconMap[block.icon] : undefined

    return (
      <section
        style={isLastSection ? {...styles.section, ...styles.sectionLast} : styles.section}
        aria-label={block.heading || undefined}
      >
        {Icon ? (
          <div className="section-icon-circle" style={styles.sectionIcon} aria-hidden="true">
            <Icon size="large" />
          </div>
        ) : null}
        <div style={styles.sectionBody}>
          {block.heading ? <Heading as="h2" level={2}>{block.heading}</Heading> : null}
          {block.content?.map((child, index) => (
            <div key={child._key || index}>
              {renderContentBlock(child, child._type !== 'accordionGroup' && Boolean(block.heading))}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <main style={styles.shell}>
      <style>{`
        .section-icon-circle svg { fill: var(--palette-graphite-0); }
        .image-text-panel-graphite.image-text-panel-graphite {
          background-color: var(--palette-graphite-10);
        }
        .image-text-panel-wrapper {
          width: 100%;
          min-width: 0;
        }
        .image-text-panel.image-text-panel {
          max-width: 100%;
          padding: 0;
        }
        .image-text-panel.image-text-panel > div:last-child {
          box-sizing: border-box;
          max-width: 100%;
          padding: var(--spacing-m);
        }
        .image-text-panel.image-text-panel > div:first-child {
          width: 100%;
          height: auto;
          aspect-ratio: 5 / 4;
          align-self: start;
          line-height: 0;
        }
        .image-text-panel img {
          display: block;
          width: 100%;
          height: 100%;
          max-height: none;
          object-fit: contain;
        }
        @media (min-width: 640px) {
          .image-text-panel.image-text-panel {
            grid-template-columns: 40% 60%;
            gap: 0;
          }
          .image-text-panel.image-text-panel > div:last-child {
            padding: var(--spacing-l);
          }
        }
      `}</style>
      {article.heroEnabled ? (
        <HighlightedIntro backgroundColor={article.heroBackgroundColor} imageUrl={heroImageSrc}>
          {breadcrumbTrail}
          <Heading as="h1" level={1}>
            {article.title || 'Untitled article'}
          </Heading>
          {article.ingress ? (
            <PortableText value={article.ingress} components={ingressComponents} />
          ) : null}
        </HighlightedIntro>
      ) : null}
      <div style={styles.page}>
        {!article.heroEnabled ? breadcrumbTrail : null}

        <article style={styles.article}>
          {!article.heroEnabled ? (
            <>
              <Heading as="h1" level={1}>
                {article.title || 'Untitled article'}
              </Heading>
              {article.ingress ? (
                <PortableText value={article.ingress} components={ingressComponents} />
              ) : null}
            </>
          ) : null}
          {sharedContentError ? (
            <p role="alert">Kunne ikke hente delt innhold: {sharedContentError}</p>
          ) : null}
          {props.isSectionPage
            ? article.sections?.map((section, index, sections) => {
                const Icon = section.icon ? sectionIconMap[section.icon] : undefined
                return (
                  <section
                    key={section._key}
                    style={
                      index === sections.length - 1
                        ? {...styles.sectionPageSection, ...styles.sectionLast}
                        : styles.sectionPageSection
                    }
                  >
                    {Icon ? (
                      <div className="section-icon-circle" style={styles.sectionIcon} aria-hidden="true">
                        <Icon size="large" />
                      </div>
                    ) : null}
                    <div style={styles.sectionBody}>
                      {section.heading && (
                        <Heading as="h2" level={2}>
                          {section.heading}
                        </Heading>
                      )}
                      {section.content?.map((block) => (
                        <div key={block._key}>
                          {renderContentBlock(block, Boolean(section.heading))}
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })
            : article.content?.map((block, index, blocks) => (
                <div key={block._key || index}>
                  {renderTopLevelBlock(block, blocks[index + 1]?._type !== 'seksjon')}
                </div>
              ))}
        </article>
      </div>
    </main>
  )
}
