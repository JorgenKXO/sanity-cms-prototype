import {Button, MegaButton} from '@skatteetaten/ds-buttons'
import {NavigationTile} from '@skatteetaten/ds-navigation'
import {Modal} from '@skatteetaten/ds-overlays'
import {useRef} from 'react'

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
  slug?: {current?: string}
  url?: string
  originalFilename?: string
}

export function getButtonLinks(block: ArticleButtonBlock): ButtonLink[] {
  return block.destinations?.length ? block.destinations : block.linkType ? [block] : []
}

type Props = {
  block: ArticleButtonBlock
  destinationsById: Record<string, ButtonDestination>
  error?: string
  isLoading: boolean
}

export function ArticleButton({block, destinationsById, error, isLoading}: Props) {
  const modalRef = useRef<HTMLDialogElement>(null)
  if (!block.label?.trim()) {
    return <p role="status">Legg til lenketekst for å forhåndsvise knappen.</p>
  }

  const links = getButtonLinks(block)
  if (!links.length) {
    return <p role="status">Legg til minst ett lenkemål for å forhåndsvise knappen.</p>
  }

  const resolvedLinks = []
  for (const link of links) {
    if (!link.label?.trim()) {
      return <p role="status">Legg til tekst for hvert lenkemål.</p>
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
      return <p role="alert">Velg en lenketype for hvert lenkemål.</p>
    }

    resolvedLinks.push({...link, href})
  }

  if (!block.appearance || !['secondary', 'primary', 'mega'].includes(block.appearance)) {
    return <p role="alert">Velg et utseende for knappen.</p>
  }

  const multiple = resolvedLinks.length > 1
  const first = resolvedLinks[0]
  const action = multiple
    ? {type: 'button' as const, onClick: () => modalRef.current?.showModal()}
    : {href: first.href, isExternal: first.linkType === 'external'}

  return (
    <div style={{padding: 'var(--spacing-s) 0'}}>
      {block.appearance === 'mega' ? (
        <MegaButton {...action}>{block.label}</MegaButton>
      ) : (
        <Button {...action} variant={block.appearance}>{block.label}</Button>
      )}
      {multiple ? (
        <Modal ref={modalRef} title={block.label}>
          <div style={{display: 'grid', gap: 'var(--spacing-m)'}}>
            {resolvedLinks.map((link, index) => (
              <NavigationTile
                key={link._key || index}
                href={link.href}
                title={link.label || ''}
                titleAs="h3"
                isExternal={link.linkType === 'external'}
                hideArrowIcon={link.linkType === 'file'}
                size="medium"
                onClick={() => modalRef.current?.close()}
              />
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
