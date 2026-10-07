import '@skatteetaten/ds-core-designtokens/index.css'
import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel} from '@skatteetaten/ds-content'
import {NavigationTile} from '@skatteetaten/ds-navigation'
import {Heading, Paragraph} from '@skatteetaten/ds-typography'
import imageUrlBuilder, {type SanityImageSource} from '@sanity/image-url'
import type {CSSProperties, JSX} from 'react'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import {InformasjonPanel} from './InformasjonPanel'
import {withAlignmentOffset} from './panelUtilities'
import {SectionSignIcon} from './SectionSignIcon'
import {navigationTileReferences} from '../schemaTypes/shared/navigationTileReferences'

type RettskilderPanelBlock = {
  _key?: string
  _type: 'rettskilderPanel'
  heading?: string
  body?: PortableTextBlock[]
}

type InformasjonPanelBlock = {
  _key?: string
  _type: 'informasjonPanel'
  color?: string
  icon?: string
  heading?: string
  body?: PortableTextBlock[]
}

type FixedPanelBlock = {
  _key?: string
  _type: 'varselPanel' | 'krisePanel'
  heading?: string
  body?: PortableTextBlock[]
}

type PanelEntry = RettskilderPanelBlock | InformasjonPanelBlock | FixedPanelBlock

type NavigationGroupHeadingTile = {
  _key?: string
  _type: 'navigationGroupHeading'
  title?: string
}

type NavigationTilePageTile = {
  _key?: string
  _type: 'navigationTilePage'
  page?: {_ref?: string}
  titleOverride?: string
  ingressOverride?: string
}

type NavigationGroup = {
  _key?: string
  _type: 'navigationGroup'
  title?: string
  tiles?: NavigationTilePageTile[]
}

type TileEntry = NavigationGroup | NavigationGroupHeadingTile | NavigationTilePageTile | PanelEntry

type NavigationPageDocument = {
  title?: string
  ingress?: PortableTextBlock[]
  heroEnabled?: boolean
  heroBackgroundColor?: string
  heroImage?: SanityImageSource
  tiles?: TileEntry[]
}

type ReferencedPage = {
  title?: string
  slug?: {current?: string}
}

// Bakgrunnsfargen på den fremhevede introen, som ekte palette-fargetokens
// (verifisert mot @skatteetaten/ds-core-designtokens/designtokens/palette.css).
const heroBackgroundMap: Record<string, string> = {
  blue: 'var(--palette-denim-10)',
  green: 'var(--palette-forest-10)',
  yellow: 'var(--palette-ochre-10)',
  white: 'var(--semantic-page-background)',
}

type NavigationPagePreviewProps = {
  document?: {
    displayed?: NavigationPageDocument
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
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 'var(--spacing-l)',
    alignItems: 'center',
    maxWidth: 'var(--semantic-responsive-wide-content)',
    margin: '0 auto',
    padding: 'var(--spacing-xl) var(--spacing-m)',
  },
  heroBand: {
    width: '100%',
  },
  heroImage: {
    display: 'block',
    maxWidth: '220px',
    height: 'auto',
    borderRadius: '4px',
  },
  empty: {
    padding: 'var(--spacing-xl)',
  },
  groupHeading: {
    marginTop: 'var(--spacing-xl)',
  },
  panel: {
    marginTop: 'var(--spacing-l)',
  },
  tileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 'var(--spacing-m)',
    marginTop: 'var(--spacing-m)',
  },
}

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

const bodyComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <Paragraph hasSpacing>{children}</Paragraph>,
    h3: ({children}) => <Heading as="h3" level={3}>{children}</Heading>,
  },
  marks: {
    link: ({children, value}) => {
      const href = isRecord(value) ? getString(value, 'href') || '#' : '#'
      return <Link href={href}>{String(children)}</Link>
    },
  },
}

export function NavigationPagePreview(props: NavigationPagePreviewProps) {
  const page = props.document?.displayed
  const client = useClient({apiVersion: '2026-09-10'})
  const builder = imageUrlBuilder(client)
  const [referencedPages, setReferencedPages] = useState<Record<string, ReferencedPage>>({})

  const tileRefs = [...new Set(navigationTileReferences(page?.tiles))]

  useEffect(() => {
    if (tileRefs.length === 0) {
      setReferencedPages({})
      return
    }

    let cancelled = false
    client
      .fetch<Record<string, ReferencedPage>>(
        `*[_id in $ids]{"_id": _id, title, slug} | order(_id) [0...200]`,
        {ids: tileRefs},
      )
      .then((results) => {
        if (cancelled) return
        const byId: Record<string, ReferencedPage> = {}
        for (const result of results as unknown as (ReferencedPage & {_id: string})[]) {
          byId[result._id] = result
        }
        setReferencedPages(byId)
      })
      .catch(() => {
        if (!cancelled) setReferencedPages({})
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tileRefs)])

  if (!page) {
    return <div style={styles.empty}>No navigation page content to preview yet.</div>
  }

  function renderPanel(panel: PanelEntry, index: number) {
    if (panel._type === 'rettskilderPanel') {
      return (
        <Panel
          key={panel._key || index}
          title={panel.heading || 'Rettskilder'}
          titleAs="h2"
          color="graphite"
          variant="filled"
          padding="m"
          spacing="l"
          renderIcon={() => withAlignmentOffset(<SectionSignIcon />)}
        >
          {panel.body ? <PortableText value={panel.body} components={bodyComponents} /> : null}
        </Panel>
      )
    }

    if (panel._type === 'informasjonPanel') {
      return (
        <InformasjonPanel
          key={panel._key || index}
          heading={panel.heading}
          color={panel.color}
          icon={panel.icon}
          body={panel.body}
        />
      )
    }

    const kind = panel._type === 'varselPanel' ? 'varsel' : 'krise'
    const appearance = fixedPanelAppearance[kind]
    const Icon = appearance.icon
    return (
      <Panel
        key={panel._key || index}
        title={panel.heading || (kind === 'varsel' ? 'Varsel' : 'Krise')}
        titleAs="h2"
        color={appearance.color}
        variant={appearance.variant}
        padding="m"
        spacing="l"
        renderIcon={() => withAlignmentOffset(<Icon />)}
      >
        {panel.body ? <PortableText value={panel.body} components={bodyComponents} /> : null}
      </Panel>
    )
  }

  function renderTiles() {
    const tiles = page?.tiles || []
    const elements: JSX.Element[] = []
    let currentGroup: JSX.Element[] = []
    let groupKey = 'default'

    function renderCard(tile: NavigationTilePageTile, index: number, hasHeading = true) {
      const referenced = tile.page?._ref ? referencedPages[tile.page._ref] : undefined
      return (
        <NavigationTile
          key={tile._key || index}
          href={referenced?.slug?.current ? `/${referenced.slug.current}` : '#'}
          title={tile.titleOverride || referenced?.title || 'Navigasjonskort'}
          titleAs={hasHeading ? 'h3' : 'h2'}
          description={tile.ingressOverride || undefined}
          size="medium"
        />
      )
    }

    function flushGroup() {
      if (currentGroup.length > 0) {
        elements.push(
          <div key={`group-${groupKey}`} style={styles.tileGrid}>
            {currentGroup}
          </div>,
        )
        currentGroup = []
      }
    }

    tiles.forEach((tile, index) => {
      if (tile._type === 'navigationGroup') {
        flushGroup()
        elements.push(
          <div key={`group-${tile._key || index}`}>
            {tile.title ? (
              <div style={styles.groupHeading}>
                <Heading as="h2" level={2}>{tile.title}</Heading>
              </div>
            ) : null}
            <div style={styles.tileGrid}>
              {tile.tiles?.map((card, cardIndex) => renderCard(card, cardIndex, Boolean(tile.title)))}
            </div>
          </div>,
        )
        groupKey = `after-${tile._key || index}`
        return
      }

      if (tile._type === 'navigationGroupHeading') {
        flushGroup()
        groupKey = tile._key || `heading-${index}`
        elements.push(
          <div key={`heading-${tile._key || index}`} style={styles.groupHeading}>
            <Heading as="h2" level={2}>
              {tile.title || 'Gruppeoverskrift'}
            </Heading>
          </div>,
        )
        return
      }

      if (tile._type !== 'navigationTilePage') {
        flushGroup()
        elements.push(
          <div key={`panel-${tile._key || index}`} style={styles.panel}>
            {renderPanel(tile, index)}
          </div>,
        )
        groupKey = tile._key || `panel-${index}`
        return
      }

      currentGroup.push(renderCard(tile, index))
    })

    flushGroup()
    return elements
  }

  const heroImageSrc = page.heroImage
    ? builder.image(page.heroImage).width(400).fit('max').auto('format').url()
    : undefined

  return (
    <main style={styles.shell}>
      {page.heroEnabled ? (
        <div
          style={{
            ...styles.heroBand,
            background: heroBackgroundMap[page.heroBackgroundColor || 'white'],
          }}
        >
          <div style={styles.hero}>
            <div>
              <Heading as="h1" level={1}>{page.title || 'Untitled navigation page'}</Heading>
              {page.ingress ? <PortableText value={page.ingress} components={ingressComponents} /> : null}
            </div>
            {heroImageSrc ? <img src={heroImageSrc} alt="" style={styles.heroImage} /> : null}
          </div>
        </div>
      ) : null}

      <div style={styles.page}>
        {!page.heroEnabled ? (
          <>
            <Heading as="h1" level={1}>{page.title || 'Untitled navigation page'}</Heading>
            {page.ingress ? <PortableText value={page.ingress} components={ingressComponents} /> : null}
          </>
        ) : null}

        {renderTiles()}
      </div>
    </main>
  )
}
