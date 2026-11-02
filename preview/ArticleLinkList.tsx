import {LinkGroup} from '@skatteetaten/ds-buttons'
import {Heading, Paragraph} from '@skatteetaten/ds-typography'
import './articleLinkList.css'

type LinkListItem =
  | {_key?: string; _type?: 'reference'; _ref?: string}
  | {_key?: string; _type: 'linkListItem'; page?: {_ref?: string}; label?: string}

export type ArticleLinkListBlock = {
  _key?: string
  _type: 'lenkeliste'
  heading?: string
  ingress?: string
  pages?: LinkListItem[]
}

export function getLinkListPageId(item: LinkListItem) {
  return item._type === 'linkListItem' ? item.page?._ref : item._ref
}

type Props = {
  block: ArticleLinkListBlock
  destinationsById: Record<string, {
    title?: string
    slug?: {current?: string}
  }>
  error?: string
  isLoading: boolean
  nested?: boolean
}

export function ArticleLinkList({block, destinationsById, error, isLoading, nested = false}: Props) {
  if (!block.pages?.length) {
    return (
      <div role="status">
        <Paragraph>Legg til minst én side for å forhåndsvise lenkelisten.</Paragraph>
      </div>
    )
  }
  if (error) {
    return (
      <div role="alert">
        <Paragraph>Kunne ikke hente sidene i lenkelisten: {error}</Paragraph>
      </div>
    )
  }

  const links = []
  for (const page of block.pages) {
    const id = getLinkListPageId(page)
    if (!id) {
      return (
        <div role="status">
          <Paragraph>Velg en Sanity-side for hver lenke i lenkelisten.</Paragraph>
        </div>
      )
    }
    const destination = destinationsById[id]
    const title = (page._type === 'linkListItem' ? page.label?.trim() : undefined)
      || destination?.title?.trim()
    if (!title || !destination?.slug?.current) {
      return (
        <div role={isLoading ? 'status' : 'alert'}>
          <Paragraph>
            {isLoading
              ? 'Laster sidene i lenkelisten …'
              : 'En side i lenkelisten ble ikke funnet eller mangler tittel eller nettadresse. Kontroller sidene du har valgt.'}
          </Paragraph>
        </div>
      )
    }
    links.push({key: page._key, title, href: `/${destination.slug.current}`})
  }

  return (
    <>
      {block.heading?.trim() ? (
        <Heading as={nested ? 'h3' : 'h2'} level={4} className="article-link-list-intro">
          {block.heading}
        </Heading>
      ) : null}
      {block.ingress?.trim() ? (
        <Paragraph variant="ingress" className="article-link-list-intro">{block.ingress}</Paragraph>
      ) : null}
      <LinkGroup variant="list" hasSpacing>
        {links.map((link, index) => (
          <LinkGroup.Link key={link.key || index} href={link.href}>
            {link.title}
          </LinkGroup.Link>
        ))}
      </LinkGroup>
    </>
  )
}
