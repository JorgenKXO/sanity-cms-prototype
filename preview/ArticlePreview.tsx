import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react'
import {Accordion, OpenClose} from '@skatteetaten/ds-collections'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel} from '@skatteetaten/ds-content'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Blockquote, Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import {InformasjonPanel, sectionIconMap} from './InformasjonPanel'
import {withAlignmentOffset} from './panelUtilities'
import {SectionSignIcon} from './SectionSignIcon'
import './numberedAccordion.css'
import {ArticleButton, getButtonLinks, type ArticleButtonBlock, type ButtonDestination} from './ArticleButton'

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

type ArticleOpenCloseBlock = {
  _key?: string
  _type: 'openClose'
  title?: string
  size?: 'small' | 'medium' | 'large'
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
    content?: PortableTextBlock[]
  }[]
}

type BlockquoteBlock = {
  _key?: string
  _type: 'sitat'
  text?: PortableTextBlock[]
  source?: string
  borderColor?: 'ochre' | 'forest' | 'denim' | 'graphite'
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
  | BlockquoteBlock
  | ArticleButtonBlock
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
  varsel: 'Varsel',
  krise: 'Krise',
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
      const size = value.size === 'small' || value.size === 'medium' || value.size === 'large'
        ? value.size
        : undefined

      return (
        <OpenClose title={title} size={size} titleAs="h3">
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
  const [buttonDestinationsById, setButtonDestinationsById] = useState<Record<string, ButtonDestination>>({})
  const [buttonDestinationError, setButtonDestinationError] = useState<string>()
  const [isLoadingButtonDestinations, setIsLoadingButtonDestinations] = useState(false)

  const sharedContentIds = [
    ...new Set(
      (article?.content || [])
        .flatMap((block) => (block._type === 'seksjon' ? block.content || [] : [block]))
        .filter((block): block is SharedContentReference => block._type === 'reference')
        .map((reference) => reference._ref),
    ),
  ]
  const sharedContentIdsKey = JSON.stringify(sharedContentIds)

  const buttonDestinationIds = [
    ...new Set(
      (article?.content || [])
        .flatMap((block) => (block._type === 'seksjon' ? block.content || [] : [block]))
        .filter((block): block is ArticleButtonBlock => block._type === 'knapp')
        .flatMap(getButtonLinks)
        .map((link) => link.linkType === 'internal'
          ? link.page?._ref
          : link.linkType === 'file' ? link.file?.asset?._ref : undefined)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const buttonDestinationIdsKey = JSON.stringify(buttonDestinationIds)

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
    if (buttonDestinationIds.length === 0) {
      setButtonDestinationsById({})
      setButtonDestinationError(undefined)
      setIsLoadingButtonDestinations(false)
      return
    }

    let cancelled = false
    setButtonDestinationsById({})
    setButtonDestinationError(undefined)
    setIsLoadingButtonDestinations(true)
    client
      .withConfig({perspective: 'drafts'})
      .fetch<ButtonDestination[]>(
        `*[_id in $ids]{_id, slug, url, originalFilename}`,
        {ids: buttonDestinationIds},
      )
      .then((results) => {
        if (cancelled) return
        setButtonDestinationsById(Object.fromEntries(results.map((result) => [result._id, result])))
        setIsLoadingButtonDestinations(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setButtonDestinationsById({})
        setButtonDestinationError(error instanceof Error ? error.message : 'Ukjent feil')
        setIsLoadingButtonDestinations(false)
      })

    return () => {
      cancelled = true
    }
    // Keep the request stable while Sanity recreates the reference array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, buttonDestinationIdsKey])

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []

  function renderContentBlock(block: InnholdBlock, nested = false) {
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

    const contentComponents: PortableTextComponents = nested
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
    if (block._type === 'tekst') {
      return block.text ? <PortableText value={block.text} components={contentComponents} /> : null
    }

    if (block._type === 'openClose') {
      if (!block.title) {
        return <p role="status">Legg til en overskrift for å forhåndsvise Åpne/Lukke.</p>
      }

      return (
        <OpenClose title={block.title} size={block.size} titleAs={nested ? 'h3' : 'h2'}>
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
        <Accordion size="large">
          {block.showNumbers ? <div role="list">{items}</div> : items}
        </Accordion>
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

    if (block._type === 'knapp') {
      return (
        <ArticleButton
          block={block}
          destinationsById={buttonDestinationsById}
          error={buttonDestinationError}
          isLoading={isLoadingButtonDestinations}
        />
      )
    }

    if (block._type === 'rettskilderPanel') {
      return (
        <Panel
          title={block.heading || 'Rettskilder'}
          titleAs={nested ? 'h3' : 'h2'}
          color="graphite"
          variant="filled"
          padding="m"
          spacing="l"
          renderIcon={() => withAlignmentOffset(<SectionSignIcon />)}
        >
          {block.body ? <PortableText value={block.body} components={panelComponents} /> : null}
        </Panel>
      )
    }

    if (block._type === 'informasjon') {
      return (
        <InformasjonPanel
          heading={block.heading}
          color={block.color}
          icon={block.icon}
          body={block.text}
          titleAs={nested ? 'h3' : 'h2'}
        />
      )
    }

    // "varsel" eller "krise"
    const appearance = fixedPanelAppearance[block._type]
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
              {renderContentBlock(child, child._type === 'openClose' && Boolean(block.heading))}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <main style={styles.shell}>
      <style>{'.section-icon-circle svg { fill: var(--palette-graphite-0); }'}</style>
      <div style={styles.page}>
        {breadcrumbs.length > 0 ? (
          <Breadcrumbs>
            <Breadcrumbs.List showLastItemAsCurrentPage>
              {breadcrumbs.map((item) => (
                <Breadcrumbs.Item key={item._key || item.label}>
                  <Breadcrumbs.Link href={item.href || '#'}>{item.label || ''}</Breadcrumbs.Link>
                </Breadcrumbs.Item>
              ))}
            </Breadcrumbs.List>
          </Breadcrumbs>
        ) : null}

        <article style={styles.article}>
          <Heading as="h1" level={1}>
            {article.title || 'Untitled article'}
          </Heading>
          {article.ingress ? (
            <PortableText value={article.ingress} components={ingressComponents} />
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
                    {Icon && (
                      <span aria-hidden="true">
                        <Icon />
                      </span>
                    )}
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
