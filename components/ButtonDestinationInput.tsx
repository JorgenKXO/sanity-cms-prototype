import {useToast} from '@sanity/ui'
import {useEffect, useRef} from 'react'
import {set, unset, useClient, type ObjectInputProps} from 'sanity'

type DestinationValue = {
  _type?: string
  linkType?: string
  label?: string
  page?: {_ref?: string}
  file?: {asset?: {_ref?: string}}
  url?: string
  destinations?: DestinationValue[]
}

export function ButtonDestinationInput(props: ObjectInputProps<DestinationValue>) {
  const client = useClient({apiVersion: '2026-09-10'})
  const toast = useToast()
  const latest = useRef(props)
  latest.current = props
  const {linkType, label, page} = props.value || {}
  const pageId = page?._ref
  const destinations = props.value?.destinations

  useEffect(() => {
    if (props.readOnly || !destinations) return

    const first = destinations[0]
    props.onChange([
      ...(first ? [
        first.linkType ? set(first.linkType, ['linkType']) : unset(['linkType']),
        first.page ? set(first.page, ['page']) : unset(['page']),
        first.file ? set(first.file, ['file']) : unset(['file']),
        first.url ? set(first.url, ['url']) : unset(['url']),
      ] : []),
      unset(['destinations']),
    ])
  }, [props.readOnly, destinations, props.onChange])

  useEffect(() => {
    if (props.readOnly || destinations || linkType !== 'internal' || !pageId || label?.trim()) return

    let cancelled = false
    client.withConfig({perspective: 'drafts'})
      .fetch<{title?: string} | null>(
        '*[_id == $id][0]{title}',
        {id: pageId.replace(/^drafts\./, '')},
      )
      .then((result) => {
        const current = latest.current
        if (cancelled || current.readOnly || current.value?.destinations ||
          current.value?.linkType !== 'internal' ||
          current.value.page?._ref !== pageId || current.value.label?.trim()) return

        if (!result?.title?.trim()) {
          toast.push({
            status: 'warning',
            title: 'Siden mangler tittel eller ble ikke funnet. Fyll inn lenketekst manuelt.',
          })
          return
        }
        current.onChange(set(result.title, ['label']))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        toast.push({
          status: 'error',
          title: 'Kunne ikke hente sidetittelen. Fyll inn lenketekst manuelt.',
          description: error instanceof Error ? error.message : 'Ukjent feil',
        })
      })

    return () => {
      cancelled = true
    }
  }, [client, toast, props.readOnly, destinations, linkType, pageId, label])

  return props.renderDefault(props)
}
