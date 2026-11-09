import {Button, MegaButton} from '@skatteetaten/ds-buttons'

type ButtonLink = {
  _key?: string
  label?: string
  linkType?: 'external' | 'internal' | 'file'
  url?: string
  page?: {_ref?: string}
  file?: {asset?: {_ref?: string}}
}

export type ArticleButtonBlock = ButtonLink & {
  _key?: string
  _type: 'knapp'
  appearance?: 'secondary' | 'primary' | 'mega'
  destinations?: ButtonLink[]
}

export type ButtonDestination = {
  _id: string
  title?: string
  slug?: {current?: string}
  url?: string
  originalFilename?: string
}

export function getButtonLinks(block: ArticleButtonBlock): ButtonLink[] {
  return block.destinations?.length ? block.destinations.slice(0, 1) : block.linkType ? [block] : []
}

type Props = {
  block: ArticleButtonBlock
  destinationsById: Record<string, ButtonDestination>
  error?: string
  isLoading: boolean
}

export function ArticleButton({block, destinationsById, error, isLoading}: Props) {
  if (!block.label?.trim()) {
    return <p role="status">Legg til lenketekst for å forhåndsvise knappen.</p>
  }

  const [link] = getButtonLinks(block)
  if (!link) {
    return <p role="status">Velg en lenke eller fil for å forhåndsvise knappen.</p>
  }

  let href: string
  if (link.linkType === 'external') {
    if (!link.url || !/^https?:\/\//i.test(link.url)) {
      return <p role="alert">Legg til en gyldig HTTP(S)-adresse for lenkemålet.</p>
    }
    href = link.url
  } else if (link.linkType === 'internal' || link.linkType === 'file') {
    const id = link.linkType === 'file' ? link.file?.asset?._ref : link.page?._ref
    if (error) {
      return <p role="alert">Kunne ikke hente lenkemålet: {error}</p>
    }
    const destination = id ? destinationsById[id] : undefined
    const url = link.linkType === 'file' ? destination?.url : destination?.slug?.current
    if (!url) {
      return (
        <p role={isLoading ? 'status' : 'alert'}>
          {isLoading
            ? 'Laster lenkemål …'
            : 'Lenkemålet ble ikke funnet eller mangler nettadresse. Velg en side eller last opp en fil.'}
        </p>
      )
    }
    href = link.linkType === 'file'
      ? `${url}?dl=${encodeURIComponent(destination?.originalFilename || '')}`
      : `/${url}`
  } else {
    return <p role="alert">Velg Lenke eller Fil for knappen.</p>
  }

  if (!block.appearance || !['secondary', 'primary', 'mega'].includes(block.appearance)) {
    return <p role="alert">Velg et utseende for knappen.</p>
  }

  const action = {href, isExternal: link.linkType === 'external'}

  return (
    <div style={{padding: 'var(--spacing-s) 0'}}>
      {block.appearance === 'mega' ? (
        <MegaButton {...action}>{block.label}</MegaButton>
      ) : (
        <Button {...action} variant={block.appearance}>{block.label}</Button>
      )}
    </div>
  )
}
