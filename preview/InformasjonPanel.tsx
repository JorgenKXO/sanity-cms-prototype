import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react'
import {Accordion, OpenClose} from '@skatteetaten/ds-collections'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel, type PanelColor, type PanelVariant} from '@skatteetaten/ds-content'
import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {Blockquote, Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import type {CSSProperties} from 'react'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {sectionIconMap} from '../components/SectionIcons'
import {ArticleButton, type ArticleButtonBlock, type ButtonDestination} from './ArticleButton'
import {ArticleLinkList, type ArticleLinkListBlock} from './ArticleLinkList'
import {withAlignmentOffset} from './panelUtilities'
import {fixedPanelAppearance} from './fixedPanelAppearance'
import './numberedAccordion.css'
import './openClose.css'
import './informasjonPanel.css'

const colorMap: Record<string, {color: PanelColor; variant: PanelVariant}> = {
  denim: {color: 'denim', variant: 'filled'},
  forest: {color: 'forest', variant: 'filled'},
  'denim-outline': {color: 'denim', variant: 'outline'},
  'forest-outline': {color: 'forest', variant: 'outline'},
  white: {color: 'graphite', variant: 'outline'},
}

type DestinationContext = {
  destinationsById: Record<string, ButtonDestination>
  error?: string
  isLoading: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getReferenceIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(getReferenceIds)
  }
  if (!isRecord(value)) {
    return []
  }

  if (typeof value._ref === 'string') {
    return [value._ref]
  }

  if (value._type === 'knapp') {
    const target = Array.isArray(value.destinations) && value.destinations.length
      ? value.destinations[0] : value
    if (!isRecord(target)) return []
    return getReferenceIds(target.linkType === 'file' ? target.file : target.page)
  }

  return [
    'page',
    'file',
    'asset',
    'destinations',
    'pages',
    'content',
    'accordions',
    'text',
    'markDefs',
  ]
    .flatMap((key) => getReferenceIds(value[key]))
}

type InformasjonPanelProps = {
  kind?: 'informasjon' | 'varsel'
  heading?: string
  color?: string
  icon?: string
  body?: PortableTextBlock[]
  titleAs?: 'h2' | 'h3'
  stackedIcon?: boolean
  destinationContext?: DestinationContext
}

export function InformasjonPanel({
  kind = 'informasjon',
  heading,
  color,
  icon,
  body,
  titleAs = 'h2',
  stackedIcon = false,
  destinationContext,
}: InformasjonPanelProps) {
  const appearance = kind === 'varsel'
    ? fixedPanelAppearance.varsel
    : colorMap[color || 'denim'] || colorMap.denim
  const Icon = kind === 'varsel'
    ? fixedPanelAppearance.varsel.icon
    : icon ? sectionIconMap[icon] : undefined
  const client = useClient({apiVersion: '2026-09-10'})
  const imageBuilder = createImageUrlBuilder(client)
  const [localDestinationContext, setLocalDestinationContext] = useState<DestinationContext>({
    destinationsById: {},
    isLoading: false,
  })
  const destinationIds = [...new Set(getReferenceIds(body))]
  const destinationIdsKey = JSON.stringify(destinationIds)
  const hasDestinationContext = destinationContext !== undefined

  useEffect(() => {
    if (hasDestinationContext) return
    if (destinationIds.length === 0) {
      setLocalDestinationContext({destinationsById: {}, isLoading: false})
      return
    }

    let cancelled = false
    setLocalDestinationContext({destinationsById: {}, isLoading: true})
    client
      .withConfig({perspective: 'drafts'})
      .fetch<ButtonDestination[]>(
        `*[_id in $ids]{_id, title, slug, url, originalFilename}`,
        {ids: destinationIds},
      )
      .then((results) => {
        if (cancelled) return
        setLocalDestinationContext({
          destinationsById: Object.fromEntries(results.map((result) => [result._id, result])),
          isLoading: false,
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLocalDestinationContext({
          destinationsById: {},
          error: error instanceof Error ? error.message : 'Ukjent feil',
          isLoading: false,
        })
      })

    return () => {
      cancelled = true
    }
    // Keep requests stable while Portable Text arrays are recreated by Sanity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, destinationIdsKey, hasDestinationContext])

  const destinations = destinationContext || localDestinationContext
  const panelStyle: CSSProperties | undefined = Icon && !stackedIcon
    ? {
        width:
          'min(var(--container-m), var(--semantic-responsive-container), calc(100vw - var(--spacing-m) - var(--spacing-m)))',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    : undefined

  const bodyComponents: PortableTextComponents = {
    block: {
      normal: ({children}) => <Paragraph hasSpacing>{children}</Paragraph>,
      h2: ({children}) => (
        <Heading as={titleAs === 'h3' ? 'h4' : 'h3'} level={3}>
          {children}
        </Heading>
      ),
      h3: ({children}) => (
        <Heading as={titleAs === 'h3' ? 'h5' : 'h4'} level={3}>
          {children}
        </Heading>
      ),
    },
    marks: {
      strong: ({children}) => <strong>{children}</strong>,
      em: ({children}) => <em>{children}</em>,
      link: ({children, text, value}) => {
        const href = isRecord(value) && typeof value.href === 'string' ? value.href : undefined
        if (!href) {
          return <span role="alert">{children} (Lenken mangler nettadresse.)</span>
        }
        return <Link href={href}>{text || String(children)}</Link>
      },
      pageLink: ({children, text, value}) => {
        const page = isRecord(value) && isRecord(value.page) ? value.page : undefined
        const id = page && typeof page._ref === 'string' ? page._ref : undefined
        if (!id) {
          return <span role="alert">{children} (Lenkemålet mangler en side.)</span>
        }
        if (destinations.error) {
          return (
            <span role="alert">
              {children} (Kunne ikke hente lenkemålet: {destinations.error})
            </span>
          )
        }
        const slug = destinations.destinationsById[id]?.slug?.current
        if (!slug) {
          return (
            <span role={destinations.isLoading ? 'status' : 'alert'}>
              {children} ({destinations.isLoading
                ? 'Laster lenkemål …'
                : 'Lenkemålet ble ikke funnet eller mangler nettadresse.'})
            </span>
          )
        }
        return <Link href={`/${slug}`}>{text || String(children)}</Link>
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
        const title = isRecord(value) && typeof value.title === 'string' ? value.title : ''
        const content =
          isRecord(value) && Array.isArray(value.content)
            ? (value.content as PortableTextBlock[])
            : undefined
        if (!title) {
          return <p role="status">Legg til en overskrift for å forhåndsvise Åpne/Lukke.</p>
        }
        return (
          <OpenClose
            title={title}
            size="large"
            titleAs={titleAs === 'h3' ? 'h4' : 'h3'}
            iconPosition="left"
            className="article-open-close"
          >
            {content ? (
              <PortableText value={content} components={bodyComponents} />
            ) : (
              <p role="status">Legg til innhold i Åpne/Lukke.</p>
            )}
          </OpenClose>
        )
      },
      accordionGroup: ({value}) => {
        const accordions =
          isRecord(value) && Array.isArray(value.accordions) ? value.accordions : []
        if (!accordions.length) {
          return <p role="status">Legg til minst én accordion for å forhåndsvise gruppen.</p>
        }
        const showNumbers = isRecord(value) && value.showNumbers === true
        const items = accordions.map((accordion, index) => {
          const item = isRecord(accordion) && typeof accordion.title === 'string' ? (
            <Accordion.Item
              key={typeof accordion._key === 'string' ? accordion._key : index}
              title={accordion.title}
              subtitle={typeof accordion.ingress === 'string' ? accordion.ingress : undefined}
              titleAs={titleAs === 'h3' ? 'h4' : 'h3'}
            >
              {Array.isArray(accordion.content) ? (
                <PortableText
                  value={accordion.content as PortableTextBlock[]}
                  components={bodyComponents}
                />
              ) : (
                <p role="status">Legg til innhold i accordionen.</p>
              )}
            </Accordion.Item>
          ) : (
            <p key={index} role="status">
              Legg til en overskrift for å forhåndsvise accordionen.
            </p>
          )
          return showNumbers ? (
            <div key={index} role="listitem" className="numbered-accordion-row">
              <span className="numbered-accordion-marker">{index + 1}</span>
              {item}
            </div>
          ) : item
        })
        return (
          <Accordion size="large" className="article-accordion-group">
            {showNumbers ? <div role="list">{items}</div> : items}
          </Accordion>
        )
      },
      knapp: ({value}) =>
        isRecord(value) && value._type === 'knapp' ? (
          <ArticleButton
            block={value as ArticleButtonBlock}
            destinationsById={destinations.destinationsById}
            error={destinations.error}
            isLoading={destinations.isLoading}
          />
        ) : null,
      informasjonPanel: ({value}) => {
        if (!isRecord(value)) return null
        return (
        <InformasjonPanel
          heading={typeof value.heading === 'string' ? value.heading : undefined}
          color={typeof value.color === 'string' ? value.color : undefined}
          icon={typeof value.icon === 'string' ? value.icon : undefined}
          body={Array.isArray(value.body) ? (value.body as PortableTextBlock[]) : undefined}
          titleAs="h3"
          stackedIcon
          destinationContext={destinations}
        />
        )
      },
      lenkeliste: ({value}) =>
        isRecord(value) && value._type === 'lenkeliste' ? (
          <ArticleLinkList
            block={value as ArticleLinkListBlock}
            destinationsById={destinations.destinationsById}
            error={destinations.error}
            isLoading={destinations.isLoading}
            nested={titleAs === 'h3'}
          />
        ) : null,
      bilde: ({value}) => {
        const image =
          isRecord(value) &&
          isRecord(value.image) &&
          isRecord(value.image.asset) &&
          typeof value.image.asset._ref === 'string'
            ? value.image
            : undefined
        if (!image) {
          return <p role="status">Legg til et bilde for å forhåndsvise blokken.</p>
        }
        const source = imageBuilder
          .image(image as SanityImageSource)
          .width(960)
          .fit('max')
          .auto('format')
          .url()
        return (
          <img
            src={source}
            alt={
              value.isDecorative === true
                ? ''
                : typeof value.alt === 'string'
                  ? value.alt
                  : ''
            }
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              margin: 'var(--spacing-m) 0',
              borderRadius: '4px',
            }}
          />
        )
      },
      eksempel: ({value}) => {
        const text =
          isRecord(value) && Array.isArray(value.text)
            ? (value.text as PortableTextBlock[])
            : undefined
        if (!text?.length) {
          return <p role="status">Legg til innhold for å forhåndsvise eksempelet.</p>
        }
        return (
          <Blockquote borderColor="ochre" hasSpacing>
            <PortableText value={text} components={bodyComponents} />
          </Blockquote>
        )
      },
    },
  }

  return (
    <div style={panelStyle}>
      <Panel
        title={heading || (kind === 'varsel' ? 'Varselspanel' : 'Informasjon')}
        titleAs={titleAs}
        color={appearance.color}
        variant={appearance.variant}
        className={[
          'information-panel',
          Icon ? 'information-panel-with-icon' : '',
          Icon && stackedIcon ? 'information-panel-icon-above' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        padding="xl"
        spacing="l"
        renderIcon={Icon ? () => withAlignmentOffset(<Icon size="extraLarge" />) : undefined}
      >
        {body ? <PortableText value={body} components={bodyComponents} /> : null}
      </Panel>
    </div>
  )
}
