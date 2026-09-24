import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel, type PanelColor, type PanelVariant} from '@skatteetaten/ds-content'
import {
  BellIcon,
  CalendarIcon,
  ClockIcon,
  CompletedIcon,
  ErrorOutlineIcon,
  HelpOutlineIcon,
  type IconPropsWithoutSvgPath,
  InfoIcon,
  LockIcon,
  WarningOutlineIcon,
} from '@skatteetaten/ds-icons'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useClient} from 'sanity'

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

type ArticleContentBlock = TekstBlock | BildeBlock | PanelBlock

type ArticleDocument = {
  title?: string
  ingress?: string
  breadcrumbs?: Breadcrumb[]
  content?: ArticleContentBlock[]
  updatedAt?: string
}

// Fargevalget redaktørene har i "Informasjon"-boksen, oversatt til Panel sine color/variant-props.
const informasjonColorMap: Record<string, {color: PanelColor; variant: PanelVariant}> = {
  denim: {color: 'denim', variant: 'filled'},
  forest: {color: 'forest', variant: 'filled'},
  'denim-outline': {color: 'denim', variant: 'outline'},
  'forest-outline': {color: 'forest', variant: 'outline'},
  white: {color: 'graphite', variant: 'outline'},
}

// Ikonvalget redaktørene har i "Informasjon"-boksen.
const informasjonIconMap: Record<string, (props: IconPropsWithoutSvgPath) => JSX.Element> = {
  info: InfoIcon,
  help: HelpOutlineIcon,
  completed: CompletedIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  bell: BellIcon,
  lock: LockIcon,
}

// "Varsel" og "Krise" har faste farger og ikoner som redaktørene ikke kan endre.
const fixedPanelAppearance: Record<
  Exclude<PanelBlock['_type'], 'informasjon'>,
  {color: PanelColor; variant: PanelVariant; icon: (props: IconPropsWithoutSvgPath) => JSX.Element}
> = {
  varsel: {color: 'ochre', variant: 'filled', icon: ErrorOutlineIcon},
  krise: {color: 'burgundy', variant: 'filled', icon: WarningOutlineIcon},
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, var(--semantic-responsive-article)) var(--semantic-responsive-internal-aside)',
    gap: 'var(--spacing-xl)',
  },
  article: {
    maxWidth: 'var(--semantic-responsive-article)',
  },
  aside: {
    borderTop: 'var(--size-small) solid var(--semantic-interactive-main)',
    paddingTop: 'var(--spacing-m)',
    color: 'var(--semantic-page-foreground)',
  },
  empty: {
    padding: 'var(--spacing-xl)',
  },
  image: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    margin: 'var(--spacing-m) 0',
    borderRadius: 'var(--border-radius-m)',
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

export function ArticlePreview(props: ArticlePreviewProps) {
  const article = props.document?.displayed
  const client = useClient({apiVersion: '2026-09-10'})
  const builder = imageUrlBuilder(client)

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []

  function renderContentBlock(block: ArticleContentBlock) {
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

    // "informasjon", "varsel" eller "krise"
    const appearance =
      block._type === 'informasjon'
        ? informasjonColorMap[block.color || 'denim'] || informasjonColorMap.denim
        : fixedPanelAppearance[block._type]
    const Icon =
      block._type === 'informasjon'
        ? (block.icon && informasjonIconMap[block.icon]) || undefined
        : fixedPanelAppearance[block._type].icon

    return (
      <Panel
        title={block.heading || panelTitle[block._type]}
        titleAs="h2"
        color={appearance.color}
        variant={appearance.variant}
        padding="m"
        spacing="l"
        renderIcon={Icon ? () => <Icon /> : undefined}
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

        <div style={styles.contentGrid}>
          <article style={styles.article}>
            <Heading as="h1" level={1}>{article.title || 'Untitled article'}</Heading>
            {article.ingress ? <Paragraph variant="ingress" hasSpacing>{article.ingress}</Paragraph> : null}
            {article.content?.map((block, index) => (
              <div key={block._key || index}>{renderContentBlock(block)}</div>
            ))}
          </article>

          <aside style={styles.aside}>
            <Heading as="h2" level={3}>Studio preview</Heading>
            <Paragraph>Header, footer, feedback widget, and top button are intentionally omitted.</Paragraph>
            {article.updatedAt ? <Paragraph>Updated: {article.updatedAt}</Paragraph> : null}
          </aside>
        </div>
      </div>
    </main>
  )
}
