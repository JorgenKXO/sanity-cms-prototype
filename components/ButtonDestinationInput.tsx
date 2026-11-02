import {useToast} from '@sanity/ui'
import {useEffect, useRef} from 'react'
import {set, useClient, type ObjectInputProps} from 'sanity'

type DestinationValue = {
  _type?: string
  linkType?: string
  label?: string
  page?: {_ref?: string}
}

export function ButtonDestinationInput(props: ObjectInputProps<DestinationValue>) {
  const client = useClient({apiVersion: '2026-09-10'})
  const toast = useToast()
  const latest = useRef(props)
  latest.current = props
  const {linkType, label, page} = props.value || {}
  const pageId = page?._ref

  useEffect(() => {
    if (props.readOnly || linkType !== 'internal' || !pageId || label?.trim()) return

    let cancelled = false
    client.withConfig({perspective: 'drafts'})
      .fetch<{title?: string} | null>(
        '*[_id == $id][0]{title}',
        {id: pageId.replace(/^drafts\./, '')},
      )
      .then((result) => {
        const current = latest.current
        if (cancelled || current.readOnly || current.value?.linkType !== 'internal' ||
          current.value.page?._ref !== pageId || current.value.label?.trim()) return

        if (!result?.title?.trim()) {
          toast.push({
            status: 'warning',
            title: 'Siden mangler tittel eller ble ikke funnet. Fyll inn tekst for valget manuelt.',
          })
          return
        }
        current.onChange(set(result.title, ['label']))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        toast.push({
          status: 'error',
          title: 'Kunne ikke hente sidetittelen. Fyll inn tekst for valget manuelt.',
          description: error instanceof Error ? error.message : 'Ukjent feil',
        })
      })

    return () => {
      cancelled = true
    }
  }, [client, toast, props.readOnly, linkType, pageId, label])

  return props.renderDefault(props)
}
