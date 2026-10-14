import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel} from '@skatteetaten/ds-content'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import {InformasjonPanel} from './InformasjonPanel'
import {withAlignmentOffset} from './panelUtilities'
import {SectionSignIcon} from './SectionSignIcon'

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
type ArticleContentBlock =
  | SharedContentBlock
  | PanelBlock
  | RettskilderPanelBlock
  | SharedContentReference

type SharedContentDocument = {
  _id: string
  title?: string
  content?: SharedContentBlock[]
}

type ArticleDocument = {
  title?: string
  ingress?: PortableTextBlock[]
  breadcrumbs?: Breadcrumb[]
  content?: ArticleContentBlock[]
  updatedAt?: string
}

const panelTitle: Record<PanelBlock['_type'], string> = {
  varsel: 'Varsel',
  krise: 'Krise',
}

type ArticlePreviewProps = {
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
  empty: {
    padding: 'var(--spacing-xl)',
  },
  image: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    margin: 'var(--spacing-m) 0',
    borderRadius: '4px',
  },
}

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => <Paragraph hasSpacing>{children}</Paragraph>,
    h2: ({children}) => <Heading as="h2" level={2}>{children}</Heading>,
    h3: ({children}) => <Heading as="h3" level={3}>{children}</Heading>,
  },
  marks: {
    link: ({children, value}) => {
      const href = isRecord(value) ? getString(value, 'href') || '#' : '#'

      return <Link href={href}>{String(children)}</Link>
    },
  },
  list: {
    bullet: ({children}) => <List as="ul" hasSpacing>{children}</List>,
    number: ({children}) => <List as="ol" hasSpacing>{children}</List>,
  },
  listItem: {
    bullet: ({children}) => <List.Element>{children}</List.Element>,
    number: ({children}) => <List.Element>{children}</List.Element>,
  },
}

// Ingressen tillater kun lenker, ingen annen formatering – egen renderer uten overskrifter/lister.
const ingressComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <Paragraph variant="ingress" hasSpacing>{children}</Paragraph>,
  },
  marks: {
    link: ({children, value}) => {
      const href = isRecord(value) ? getString(value, 'href') || '#' : '#'

      return <Link href={href}>{String(children)}</Link>
    },
  },
}

export function ArticlePreview(props: ArticlePreviewProps) {
  const article = props.document?.displayed
  const client = useClient({apiVersion: '2026-09-10'})
  const builder = imageUrlBuilder(client)
  const [sharedContentById, setSharedContentById] = useState<Record<string, SharedContentDocument>>({})
  const [sharedContentError, setSharedContentError] = useState<string>()
  const [isLoadingSharedContent, setIsLoadingSharedContent] = useState(false)

  const sharedContentIds = [
    ...new Set(
      (article?.content || [])
        .filter((block): block is SharedContentReference => block._type === 'reference')
        .map((reference) => reference._ref),
    ),
  ]
  const sharedContentIdsKey = JSON.stringify(sharedContentIds)

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

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []

  function renderContentBlock(block: ArticleContentBlock) {
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
          {renderContentBlock(sharedBlock)}
        </div>
      ))
    }

    if (block._type === 'tekst') {
      return block.text ? <PortableText value={block.text} components={components} /> : null
    }

    if (block._type === 'bilde') {
      if (!block.image) {
        return null
      }
      const src = builder.image(block.image).width(960).fit('max').auto('format').url()
      return (
        <img
          src={src}
          alt={block.isDecorative ? '' : block.alt || ''}
          style={styles.image}
        />
      )
    }

    if (block._type === 'rettskilderPanel') {
      return (
        <Panel
          title={block.heading || 'Rettskilder'}
          titleAs="h2"
          color="graphite"
          variant="filled"
          padding="m"
          spacing="l"
          renderIcon={() => withAlignmentOffset(<SectionSignIcon />)}
        >
          {block.body ? <PortableText value={block.body} components={components} /> : null}
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
        />
      )
    }

    // "varsel" eller "krise"
    const appearance = fixedPanelAppearance[block._type]
    const Icon = appearance.icon

    return (
      <Panel
        title={block.heading || panelTitle[block._type]}
        titleAs="h2"
        color={appearance.color}
        variant={appearance.variant}
        padding="m"
        spacing="l"
        renderIcon={Icon ? () => withAlignmentOffset(<Icon />) : undefined}
      >
        {block.text ? <PortableText value={block.text} components={components} /> : null}
      </Panel>
    )
  }

  return (
    <main style={styles.shell}>
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
          <Heading as="h1" level={1}>{article.title || 'Untitled article'}</Heading>
          {article.ingress ? <PortableText value={article.ingress} components={ingressComponents} /> : null}
          {sharedContentError ? (
            <p role="alert">Kunne ikke hente delt innhold: {sharedContentError}</p>
          ) : null}
          {article.content?.map((block, index) => (
            <div key={block._key || index}>{renderContentBlock(block)}</div>
          ))}
        </article>
      </div>
    </main>
  )
}
