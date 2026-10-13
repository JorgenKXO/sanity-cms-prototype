import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import '@skatteetaten/ds-core-designtokens/index.css'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel, type PanelColor, type PanelVariant} from '@skatteetaten/ds-content'
import {NavigationTile} from '@skatteetaten/ds-navigation'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties} from 'react'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {
  homepageIconOptions,
  normalizeHomepageIconValue,
} from '../components/HomepageIconInput'
import {InformasjonPanel} from './InformasjonPanel'

type ForsideNavigasjonskort = {
  _key?: string
  _type: 'forsideNavigasjonskort'
  page?: {_ref?: string}
  titleOverride?: string
  ingressOverride?: string
  icon?: string
}

type ForsideNavigasjonsgruppe = {
  _key?: string
  _type: 'forsideNavigasjonsgruppe'
  title?: string
  tiles?: ForsideNavigasjonskort[]
}

type InformasjonBlokk = {
  _key?: string
  _type: 'informasjonPanel'
  heading?: string
  color?: string
  icon?: string
  body?: PortableTextBlock[]
}

type BildeOgTekstBlokk = {
  _key?: string
  _type: 'bildeOgTekstPanel'
  heading?: string
  body?: PortableTextBlock[]
  image?: SanityImageSource
  imageSide?: 'left' | 'right'
  isDecorative?: boolean
  alt?: string
  color?: string
}

type ForsideBlock = ForsideNavigasjonsgruppe | InformasjonBlokk | BildeOgTekstBlokk

type ForsideDocument = {
  title?: string
  hideTitle?: boolean
  screenReaderTitle?: string
  content?: ForsideBlock[]
}

type ReferencedPage = {
  _id: string
  title?: string
  slug?: {current?: string}
}

type ForsidePreviewProps = {
  document?: {
    displayed?: ForsideDocument
  }
}

type PanelAppearance = {color: PanelColor; variant: PanelVariant}

const panelAppearance: Record<string, PanelAppearance> = {
  burgundy: {color: 'burgundy', variant: 'filled'},
  forest: {color: 'forest', variant: 'filled'},
  denim: {color: 'denim', variant: 'filled'},
  ochre: {color: 'ochre', variant: 'filled'},
  white: {color: 'graphite', variant: 'outline'},
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
  image: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '4px',
  },
  empty: {
    padding: 'var(--spacing-xl)',
  },
}

const richTextComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <Paragraph hasSpacing>{children}</Paragraph>,
    h2: ({children}) => <Heading as="h3" level={3}>{children}</Heading>,
    h3: ({children}) => <Heading as="h3" level={3}>{children}</Heading>,
  },
  marks: {
    link: ({children, value}) => {
      const href =
        typeof value === 'object' && value !== null && 'href' in value && typeof value.href === 'string'
          ? value.href
          : '#'
      return <Link href={href}>{children}</Link>
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ukjent feil'
}

export function ForsidePreview({document}: ForsidePreviewProps) {
  const page = document?.displayed
  const client = useClient({apiVersion: '2026-09-10'})
  const builder = imageUrlBuilder(client)
  const [referencedPages, setReferencedPages] = useState<Record<string, ReferencedPage>>({})
  const [referenceError, setReferenceError] = useState<string>()

  const referenceIds = [
    ...new Set(
      (page?.content || [])
        .flatMap((block) => (block._type === 'forsideNavigasjonsgruppe' ? block.tiles || [] : []))
        .map((card) => card.page?._ref)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  useEffect(() => {
    if (referenceIds.length === 0) {
      setReferencedPages({})
      setReferenceError(undefined)
      return
    }

    let cancelled = false
    client
      .fetch<ReferencedPage[]>(
        `*[_id in $ids]{"_id": _id, title, slug}`,
        {ids: referenceIds},
      )
      .then((results) => {
        if (cancelled) return
        setReferencedPages(Object.fromEntries(results.map((result) => [result._id, result])))
        setReferenceError(undefined)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReferenceError(getErrorMessage(error))
        }
      })

    return () => {
      cancelled = true
    }
    // Keep the request stable while Sanity recreates the reference array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(referenceIds)])

  if (!page) {
    return <div style={styles.empty}>Ingen forside å forhåndsvise ennå.</div>
  }

  const iconPaths = Object.fromEntries(
    homepageIconOptions.map(({value, svgPath}) => [value, svgPath]),
  )

  function renderCard(card: ForsideNavigasjonskort, index: number, hasGroupTitle: boolean) {
    const referenced = card.page?._ref ? referencedPages[card.page._ref] : undefined
    const slug = referenced?.slug?.current
    const iconValue = normalizeHomepageIconValue(card.icon)

    return (
      <NavigationTile
        key={card._key || index}
        href={slug ? `/${slug}` : '#'}
        title={card.titleOverride || referenced?.title || 'Navigasjonskort'}
        titleAs={hasGroupTitle ? 'h3' : 'h2'}
        description={card.ingressOverride || undefined}
        size="extraLarge"
        svgPath={iconValue ? iconPaths[iconValue] : undefined}
      />
    )
  }

  function renderBlock(block: ForsideBlock, index: number) {
    if (block._type === 'forsideNavigasjonsgruppe') {
      const hasGroupTitle = Boolean(block.title)
      return (
        <section key={block._key || index} style={{marginTop: 'var(--spacing-l)'}}>
          {hasGroupTitle ? (
            <Heading as="h2" level={2}>
              {block.title}
            </Heading>
          ) : null}
          <div className="frontpage-card-grid">
            {(block.tiles || []).map((card, cardIndex) => renderCard(card, cardIndex, hasGroupTitle))}
          </div>
        </section>
      )
    }

    if (block._type === 'informasjonPanel') {
      return (
        <div key={block._key || index} style={{marginTop: 'var(--spacing-l)'}}>
          <InformasjonPanel
            heading={block.heading}
            color={block.color}
            icon={block.icon}
            body={block.body}
          />
        </div>
      )
    }

    if (block._type === 'bildeOgTekstPanel') {
      const appearance = panelAppearance[block.color || 'denim'] || panelAppearance.denim
      const image = block.image ? (
        <img
          src={builder.image(block.image).width(960).fit('max').auto('format').url()}
          alt={block.isDecorative ? '' : block.alt || ''}
          style={styles.image}
        />
      ) : null
      const text = block.body ? (
        <div>
          <PortableText value={block.body} components={richTextComponents} />
        </div>
      ) : null
      const left = block.imageSide === 'left'

      return (
        <div key={block._key || index} style={{marginTop: 'var(--spacing-l)'}}>
          <Panel
            title={block.heading || 'Bilde og tekst'}
            titleAs="h2"
            color={appearance.color}
            variant={appearance.variant}
            padding="m"
            spacing="l"
          >
            <div className={image ? `image-text-content ${left ? 'image-left' : 'image-right'}` : undefined}>
              {image && left ? image : null}
              {text}
              {image && !left ? image : null}
            </div>
          </Panel>
        </div>
      )
    }

    return null
  }

  const renderedBlocks = (page.content || []).map(renderBlock)
  const headingText = page.hideTitle ? page.screenReaderTitle || 'Forside' : page.title || 'Forside'

  return (
    <main style={styles.shell}>
      <style>{`
        .frontpage-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--spacing-m);
        }
        .sr-readonly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .image-text-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--spacing-l);
          align-items: start;
        }
        @media (max-width: 40rem) {
          .frontpage-card-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .image-text-content {
            grid-template-columns: minmax(0, 1fr);
          }
          .image-text-content.image-right > :first-child {
            order: 2;
          }
        }
      `}</style>
      <div style={styles.page}>
        <Heading as="h1" level={1} className={page.hideTitle ? 'sr-readonly' : undefined}>
          {headingText}
        </Heading>
        {referenceError ? (
          <Paragraph role="alert">
            Klarte ikke å hente lenkede sider: {referenceError}
          </Paragraph>
        ) : null}
        {renderedBlocks}
      </div>
    </main>
  )
}
