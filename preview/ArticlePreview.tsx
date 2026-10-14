import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel} from '@skatteetaten/ds-content'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useClient} from 'sanity'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import {InformasjonPanel, iconMap as sectionIconMap} from './InformasjonPanel'
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

type PanelBlock = {
  _key?: string
  _type: 'informasjon' | 'varsel' | 'krise'
  heading?: string
  color?: string
  icon?: string
  text?: PortableTextBlock[]
}

type RettskilderPanelBlock = {
  _key?: string
  _type: 'rettskilderPanel'
  heading?: string
  body?: PortableTextBlock[]
}

type InnholdBlock = TekstBlock | BildeBlock | PanelBlock | RettskilderPanelBlock

type SeksjonBlock = {
  _key?: string
  _type: 'seksjon'
  heading?: string
  icon?: string
  content?: InnholdBlock[]
}

type ArticleContentBlock = InnholdBlock | SeksjonBlock

type ArticleDocument = {
  title?: string
  ingress?: PortableTextBlock[]
  breadcrumbs?: Breadcrumb[]
  content?: ArticleContentBlock[]
  updatedAt?: string
}

const panelTitle: Record<PanelBlock['_type'], string> = {
  informasjon: 'Informasjon',
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

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []

  function renderContentBlock(block: InnholdBlock) {
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
          <div style={styles.sectionIcon} aria-hidden="true">
            <Icon size="large" />
          </div>
        ) : null}
        <div style={styles.sectionBody}>
          {block.heading ? <Heading as="h2" level={2}>{block.heading}</Heading> : null}
          {block.content?.map((child, index) => (
            <div key={child._key || index}>{renderContentBlock(child)}</div>
          ))}
        </div>
      </section>
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
          {article.content?.map((block, index, blocks) => (
            <div key={block._key || index}>
              {renderTopLevelBlock(block, blocks[index + 1]?._type !== 'seksjon')}
            </div>
          ))}
        </article>
      </div>
    </main>
  )
}
