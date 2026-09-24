import {AddIcon, SearchIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Inline,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import type {ArraySchemaType} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import type {ArrayInputFunctionsProps, ObjectItem} from 'sanity'
import {useClient, useFormValue} from 'sanity'

type SearchResult = {
  _id: string
  _type: 'article' | 'navigationPage'
  title?: string
}

type NavigationTilePageItem = ObjectItem & {
  _type: 'navigationTilePage'
  page?: {_type: 'reference'; _ref: string}
}

function isNavigationTilePageItem(item: ObjectItem): item is NavigationTilePageItem {
  return item._type === 'navigationTilePage'
}

// Slår sammen "Gruppeoverskrift" og "Sideflis" (standardvalgene) med et eget
// alternativ for å søke opp og legge til flere sidefliser samtidig.
export function NavigationTilesArrayFunctions(
  props: ArrayInputFunctionsProps<ObjectItem, ArraySchemaType>,
) {
  const {onItemAppend, onValueCreate, schemaType, value} = props
  const client = useClient({apiVersion: '2026-09-10'})
  const documentId = useFormValue(['_id']) as string | undefined
  const currentDocumentId = documentId?.replace(/^drafts\./, '')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [submittedTerm, setSubmittedTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})

  const existingPageIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of value || []) {
      if (isNavigationTilePageItem(item) && item.page?._ref) {
        ids.add(item.page._ref)
      }
    }
    return ids
  }, [value])

  const pageTileType = useMemo(
    () => schemaType.of.find((memberType) => memberType.name === 'navigationTilePage'),
    [schemaType],
  )

  const runSearch = useCallback(
    async (term: string) => {
      setSubmittedTerm(term)
      if (!term.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        const found = await client.fetch<SearchResult[]>(
          `*[(_type == "article" || _type == "navigationPage") && title match $term]{_id, _type, title} | order(title asc)[0...60]`,
          {term: `${term.trim()}*`},
        )
        // Slå sammen utkast og publisert versjon av samme dokument til én rad
        // (identifisert ved _id uten "drafts."-prefiks), og ekskluder dokumentet
        // som redigeres akkurat nå.
        const byId = new Map<string, SearchResult>()
        for (const doc of found) {
          const id = doc._id.replace(/^drafts\./, '')
          if (id === currentDocumentId) continue
          const existing = byId.get(id)
          if (!existing || doc._id === id) {
            byId.set(id, {...doc, _id: id})
          }
        }
        setResults(Array.from(byId.values()))
      } catch {
        setError('Klarte ikke å søke. Prøv igjen.')
        setResults(null)
      } finally {
        setLoading(false)
      }
    },
    [client, currentDocumentId],
  )

  function openDialog() {
    setDialogOpen(true)
    setSearchTerm('')
    setSubmittedTerm('')
    setResults(null)
    setSelectedIds({})
    setError(null)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => ({...prev, [id]: !prev[id]}))
  }

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  function handleAddSelected() {
    if (!pageTileType) return
    Object.keys(selectedIds)
      .filter((id) => selectedIds[id])
      .forEach((id) => {
        const item = onValueCreate(pageTileType as unknown as ArraySchemaType) as NavigationTilePageItem
        item.page = {_type: 'reference', _ref: id}
        onItemAppend(item)
      })
    closeDialog()
  }

  return (
    <Stack space={3}>
      <MenuButton
        id="navigation-tiles-add-menu"
        button={<Button icon={AddIcon} mode="ghost" text="Legg til element…" />}
        menu={
          <Menu>
            {schemaType.of.map((memberType) => (
              <MenuItem
                key={memberType.name}
                text={memberType.title || memberType.name}
                icon={memberType.icon}
                onClick={() => onItemAppend(onValueCreate(memberType as unknown as ArraySchemaType))}
              />
            ))}
            <MenuDivider />
            <MenuItem
              text="Legg til flere sidefliser…"
              icon={SearchIcon}
              onClick={openDialog}
            />
          </Menu>
        }
      />

      {dialogOpen ? (
        <Dialog
          id="bulk-navigation-tile-picker"
          header="Legg til flere sidefliser"
          width={1}
          onClose={closeDialog}
        >
          <Box padding={4}>
            <Stack space={4}>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  runSearch(searchTerm)
                }}
              >
                <Flex gap={2}>
                  <Box flex={1}>
                    <TextInput
                      icon={SearchIcon}
                      placeholder="Søk etter artikler eller navigasjonssider…"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    />
                  </Box>
                  <Button type="submit" text="Søk" tone="primary" />
                </Flex>
              </form>

              {loading ? (
                <Flex padding={4} justify="center">
                  <Spinner muted />
                </Flex>
              ) : null}

              {error ? (
                <Card padding={3} radius={2} tone="critical">
                  <Text size={1}>{error}</Text>
                </Card>
              ) : null}

              {!loading && !error && results && results.length === 0 && submittedTerm ? (
                <Card padding={3} radius={2} tone="transparent">
                  <Text size={1} muted>
                    Ingen treff for «{submittedTerm}».
                  </Text>
                </Card>
              ) : null}

              {!loading && results && results.length > 0 ? (
                <Card border radius={2}>
                  <Stack space={0}>
                    {results.map((result) => {
                      const alreadyAdded = existingPageIds.has(result._id)
                      return (
                        <Card
                          key={result._id}
                          padding={3}
                          borderBottom
                          tone={alreadyAdded ? 'transparent' : 'default'}
                        >
                          <Flex align="center" gap={3}>
                            <Checkbox
                              disabled={alreadyAdded}
                              checked={alreadyAdded || Boolean(selectedIds[result._id])}
                              onChange={() => toggleSelected(result._id)}
                              id={`bulk-tile-${result._id}`}
                            />
                            <Box flex={1}>
                              <Text as="label" htmlFor={`bulk-tile-${result._id}`}>
                                {result.title || 'Uten tittel'}
                              </Text>
                              <Box marginTop={1}>
                                <Text size={1} muted>
                                  {result._type === 'navigationPage' ? 'Navigasjonsside' : 'Artikkel'}
                                  {alreadyAdded ? ' · allerede lagt til' : ''}
                                </Text>
                              </Box>
                            </Box>
                          </Flex>
                        </Card>
                      )
                    })}
                  </Stack>
                </Card>
              ) : null}

              <Inline space={2}>
                <Button
                  text={`Legg til${selectedCount ? ` (${selectedCount})` : ''}`}
                  tone="positive"
                  disabled={selectedCount === 0}
                  onClick={handleAddSelected}
                />
                <Button text="Avbryt" mode="bleed" onClick={closeDialog} />
              </Inline>
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </Stack>
  )
}
