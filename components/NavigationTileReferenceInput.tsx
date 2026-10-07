import {Badge} from '@sanity/ui'
import type {ReferenceSchemaType, ReferenceValue} from '@sanity/types'
import {useCallback, useMemo} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useFormValue} from 'sanity'
import {navigationTileReferences} from '../schemaTypes/shared/navigationTileReferences'

type Props = ObjectInputProps<ReferenceValue, ReferenceSchemaType>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeId(id: string) {
  return id.replace(/^drafts\./, '')
}

export function NavigationTileReferenceInput(props: Props) {
  const tiles = useFormValue(['tiles'])
  const itemSegment = props.path[props.path.length - 2]
  const itemKey =
    isRecord(itemSegment) && typeof itemSegment._key === 'string' ? itemSegment._key : undefined
  const {renderPreview} = props

  const existingPageIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ref of navigationTileReferences(tiles, itemKey)) {
      ids.add(normalizeId(ref))
    }
    return ids
  }, [itemKey, tiles])

  const renderMarkedPreview = useCallback<Props['renderPreview']>(
    (previewProps) => {
      const value = previewProps.value
      const alreadyAdded =
        isRecord(value) &&
        typeof value._id === 'string' &&
        existingPageIds.has(normalizeId(value._id))

      if (!alreadyAdded) return renderPreview(previewProps)

      return renderPreview({
        ...previewProps,
        children: (
          <>
            <Badge tone="primary" mode="outline">
              Allerede lagt til
            </Badge>
            {previewProps.children}
          </>
        ),
      })
    },
    [existingPageIds, renderPreview],
  )

  return props.renderDefault({...props, renderPreview: renderMarkedPreview})
}
