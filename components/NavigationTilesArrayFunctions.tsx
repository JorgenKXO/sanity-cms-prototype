import {AddIcon, DocumentsIcon, SearchIcon} from '@sanity/icons'
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
  MenuItem,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import type {ArraySchemaType} from '@sanity/types'
import {useEffect, useMemo, useRef, useState} from 'react'
import type {ArrayInputFunctionsProps, ObjectItem} from 'sanity'
import {insert, PatchEvent, setIfMissing, useClient, useFormValue} from 'sanity'

type SearchResult = {
  _id: string
  _type: 'article' | 'navigationPage'
  title?: string
  matchedIn?: 'title' | 'ingress' | 'content'
}

const SEARCH_DEBOUNCE_MS = 250

// Søker i tittel, navigasjonstittel, ingress, navigasjonsingress og all tekst i
// innholdsblokker/bokser. Treff i tittel og ingress rangeres høyest.
const SEARCH_QUERY = `*[
  _type in ["article", "navigationPage"] &&
  !(_id in path("versions.**")) &&
  [
    title,
    listHeading,
    listIngress,
    ...ingress[].children[].text,
    ...content[].heading,
    ...content[].text[].children[].text,
    ...content[].body[].children[].text,
    ...panels[].heading,
    ...panels[].body[].children[].text
  ] match $terms
]
| score(
  boost(title match $terms, 5),
  boost(listHeading match $terms, 4),
  boost(ingress[].children[].text match $terms, 2),
  boost(listIngress match $terms, 2)
)
| order(_score desc, title asc)[0...60]{
  _id,
  _type,
  title,
  "matchedIn": select(
    [title, listHeading] match $terms => "title",
    [listIngress, ...ingress[].children[].text] match $terms => "ingress",
    "content"
  )
}`

const matchedInLabels: Record<NonNullable<SearchResult['matchedIn']>, string> = {
  title: 'treff i tittel',
  ingress: 'treff i ingress',
  content: 'treff i innhold',
}

// Gjør hvert ord i søket til et prefikssøk, slik at "bet inn" finner "Betaling og innkreving".
function toSearchTerms(term: string): string[] {
  return term
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/\*/g, ''))
    .filter(Boolean)
    .map((word) => `${word}*`)
}

type NavigationTilePageItem = ObjectItem & {
  _type: 'navigationTilePage'
  page?: {_type: 'reference'; _ref: string}
}

function isNavigationTilePageItem(item: ObjectItem): item is NavigationTilePageItem {
  return item._type === 'navigationTilePage'
}

// Slår sammen "Gruppeoverskrift" og "Navigasjonskort" (standardvalgene) med et eget
// alternativ for å søke opp og legge til flere navigasjonskort samtidig.
export function NavigationTilesArrayFunctions(
  props: ArrayInputFunctionsProps<ObjectItem, ArraySchemaType>,
) {
  const {onChange, onItemAppend, onValueCreate, schemaType, value} = props
  const client = useClient({apiVersion: '2026-09-10'})
  const documentId = useFormValue(['_id']) as string | undefined
  const currentDocumentId = documentId?.replace(/^drafts\./, '')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [submittedTerm, setSubmittedTerm] = useState('')
  const latestRequestId = useRef(0)
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

  useEffect(() => {
    if (!dialogOpen) return
    const requestId = ++latestRequestId.current
    const terms = toSearchTerms(searchTerm)

    if (terms.length === 0) {
      setSubmittedTerm('')
      setResults(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const found = await client.fetch<SearchResult[]>(SEARCH_QUERY, {terms})
        if (requestId !== latestRequestId.current) return
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
        setSubmittedTerm(searchTerm.trim())
        setError(null)
      } catch {
        if (requestId !== latestRequestId.current) return
        setError('Klarte ikke å søke. Prøv igjen.')
        setResults(null)
      } finally {
        if (requestId === latestRequestId.current) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [client, currentDocumentId, dialogOpen, searchTerm])

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
    const items = Object.keys(selectedIds)
      .filter((id) => selectedIds[id] && !existingPageIds.has(id))
      .map((id) => {
        const item = onValueCreate(pageTileType as unknown as ArraySchemaType) as NavigationTilePageItem
        item.page = {_type: 'reference', _ref: id}
        return item
      })
    if (items.length === 0) return
    onChange(PatchEvent.from([setIfMissing([]), insert(items, 'after', [-1])]))
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
            <MenuItem
              text="Flere navigasjonskort"
              icon={DocumentsIcon}
              onClick={openDialog}
            />
          </Menu>
        }
      />

      {dialogOpen ? (
        <Dialog
          id="bulk-navigation-tile-picker"
          header="Legg til flere navigasjonskort"
          width={1}
          onClose={closeDialog}
        >
          <Box padding={4}>
            <Stack space={4}>
              <TextInput
                autoFocus
                aria-label="Søk etter artikler eller navigasjonssider"
                icon={SearchIcon}
                iconRight={loading && results ? () => <Spinner muted /> : undefined}
                placeholder="Søk i tittel, ingress og innhold…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault()
                }}
              />

              {loading && !results ? (
                <Flex padding={4} justify="center">
                  <Spinner muted />
                </Flex>
              ) : null}

              {error ? (
                <Card padding={3} radius={2} tone="critical">
                  <Text size={1}>{error}</Text>
                </Card>
              ) : null}

              {!error && results && results.length === 0 && submittedTerm ? (
                <Card padding={3} radius={2} tone="transparent">
                  <Text size={1} muted>
                    Ingen treff for «{submittedTerm}».
                  </Text>
                </Card>
              ) : null}

              {results && results.length > 0 ? (
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
                                  {result.matchedIn ? ` · ${matchedInLabels[result.matchedIn]}` : ''}
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
