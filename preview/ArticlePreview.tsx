import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel} from '@skatteetaten/ds-content'
import {Breadcrumbs} from '@skatteetaten/ds-navigation'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import type {CSSProperties} from 'react'

type Breadcrumb = {
  _key?: string
  label?: string
  href?: string
}

type InfoBox = {
  _key?: string
  _type: 'infoBox'
  title?: string
  text?: string
}

type RelatedLink = {
  _key?: string
  _type: 'relatedLink'
  label?: string
  href?: string
}

type ArticleBlock = PortableTextBlock | InfoBox | RelatedLink

type ArticleDocument = {
  title?: string
  ingress?: string
  breadcrumbs?: Breadcrumb[]
  body?: ArticleBlock[]
  updatedAt?: string
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
  types: {
    infoBox: ({value}) => {
      const title = isRecord(value) ? getString(value, 'title') : undefined
      const text = isRecord(value) ? getString(value, 'text') : undefined

      return (
        <Panel title={title} titleAs="h2" color="denim" padding="m" spacing="l">
          {text ? <Paragraph>{text}</Paragraph> : null}
        </Panel>
      )
    },
    relatedLink: ({value}) => {
      const label = isRecord(value) ? getString(value, 'label') : undefined
      const href = isRecord(value) ? getString(value, 'href') || '#' : '#'

      return <Paragraph hasSpacing><Link href={href}>{`${label || 'Related content'} >`}</Link></Paragraph>
    },
  },
}

export function ArticlePreview(props: ArticlePreviewProps) {
  const article = props.document?.displayed

  if (!article) {
    return <div style={styles.empty}>No article content to preview yet.</div>
  }

  const breadcrumbs = article.breadcrumbs?.filter((item) => item.label) || []

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
            {article.body ? <PortableText value={article.body} components={components} /> : null}
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
