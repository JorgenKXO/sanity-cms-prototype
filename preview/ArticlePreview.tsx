import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel} from '@skatteetaten/ds-content'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useClient} from 'sanity'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import {InformasjonPanel, sectionIconMap} from './InformasjonPanel'
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

type ArticleContentBlock = TekstBlock | BildeBlock | PanelBlock | RettskilderPanelBlock

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
    content?: ArticleContentBlock[]
  }[]
}

const panelTitle: Record<PanelBlock['_type'], string> = {
  informasjon: 'Informasjon',
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
  section: {
    borderTop: '2px solid var(--palette-forest-50)',
    padding: 'var(--spacing-xxl) 0 var(--spacing-l)',
  },
  sectionLast: {
    borderBottom: '2px solid var(--palette-forest-50)',
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

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []

  function renderContentBlock(block: ArticleContentBlock, nested = false) {
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

    if (block._type === 'bilde') {
      if (!block.image) {
        return null
      }
      const src = builder.image(block.image).width(960).fit('max').auto('format').url()
      return <img src={src} alt={block.isDecorative ? '' : block.alt || ''} style={styles.image} />
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
          <Heading as="h1" level={1}>
            {article.title || 'Untitled article'}
          </Heading>
          {article.ingress ? (
            <PortableText value={article.ingress} components={ingressComponents} />
          ) : null}
          {props.isSectionPage
            ? article.sections?.map((section, index, sections) => {
                const Icon = section.icon ? sectionIconMap[section.icon] : undefined
                return (
                  <section
                    key={section._key}
                    style={
                      index === sections.length - 1
                        ? {...styles.section, ...styles.sectionLast}
                        : styles.section
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
            : article.content?.map((block, index) => (
                <div key={block._key || index}>{renderContentBlock(block)}</div>
              ))}
        </article>
      </div>
    </main>
  )
}
