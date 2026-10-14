import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {FormInput, type ArrayOfObjectsInputProps} from 'sanity'

export const MAX_SECTIONS = 10

export function SectionsInput(props: ArrayOfObjectsInputProps) {
  const {members, value = [], readOnly, onItemAppend, onItemMove, onItemRemove, onPathFocus} = props
  const addButton = useRef<HTMLButtonElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<string | undefined>(undefined)
  const focusAdd = useRef(false)
  const [deleting, setDeleting] = useState<string>()
  const count = value.length

  useEffect(() => {
    if (focusAdd.current) {
      addButton.current?.focus()
      focusAdd.current = false
    }
    if (!pendingFocus.current) return
    const section = container.current?.querySelector<HTMLElement>(
      `[data-section-key="${pendingFocus.current}"]`,
    )
    if (!section) return
    onPathFocus([{_key: pendingFocus.current}, 'blockName'])
    section.querySelector<HTMLElement>('input, textarea, select')?.focus()
    pendingFocus.current = undefined
  }, [value, onPathFocus])

  function addSection() {
    if (readOnly || count >= MAX_SECTIONS) return
    const key = crypto.randomUUID().replace(/-/g, '')
    const section = {_key: key, _type: 'pageSection'}
    pendingFocus.current = key
    onItemAppend(section)
  }

  return (
    <Stack ref={container} space={4}>
      <Text size={1} aria-live="polite">
        {count} av {MAX_SECTIONS} seksjoner
      </Text>
      {count >= MAX_SECTIONS && (
        <Card padding={3} tone={count > MAX_SECTIONS ? 'critical' : 'primary'} role="status">
          <Text size={1}>
            {count > MAX_SECTIONS
              ? 'Siden har for mange seksjoner. Slett seksjoner slik at det er maksimalt 10.'
              : 'Du har nådd grensen på 10 seksjoner.'}
          </Text>
        </Card>
      )}
      {members.map((member) => {
        if (member.kind === 'error') {
          return (
            <Card key={member.key} padding={3} tone="critical" role="alert">
              <Text>
                En seksjon har ugyldige data. Kontakt en administrator for å rette innholdet.
              </Text>
            </Card>
          )
        }
        const {key, index} = member
        const locked = readOnly || member.item.readOnly
        return (
          <Card key={key} data-section-key={key} border padding={4} radius={2}>
            <Stack space={4}>
              <Text as="h2" weight="semibold">
                Seksjon {index + 1}
              </Text>
              <Flex gap={2} wrap="wrap">
                <Button
                  text="Flytt opp"
                  aria-label={`Flytt seksjon ${index + 1} opp`}
                  disabled={locked || index === 0}
                  mode="ghost"
                  onClick={() => onItemMove({fromIndex: index, toIndex: index - 1})}
                />
                <Button
                  text="Flytt ned"
                  aria-label={`Flytt seksjon ${index + 1} ned`}
                  disabled={locked || index === count - 1}
                  mode="ghost"
                  onClick={() => onItemMove({fromIndex: index, toIndex: index + 1})}
                />
                <Button
                  text="Slett seksjon"
                  aria-label={`Slett seksjon ${index + 1}`}
                  disabled={locked}
                  tone="critical"
                  mode="ghost"
                  onClick={() => setDeleting(key)}
                />
              </Flex>
              {deleting === key && (
                <Card padding={3} tone="caution" role="group" aria-label="Bekreft sletting">
                  <Stack space={3}>
                    <Text size={1}>Vil du slette seksjon {index + 1} med alt innhold?</Text>
                    <Flex gap={2}>
                      <Button
                        text="Ja, slett seksjonen"
                        tone="critical"
                        disabled={locked}
                        onClick={() => {
                          focusAdd.current = true
                          onItemRemove(key)
                          setDeleting(undefined)
                        }}
                      />
                      <Button text="Avbryt" mode="ghost" onClick={() => setDeleting(undefined)} />
                    </Flex>
                  </Stack>
                </Card>
              )}
              <FormInput {...props} relativePath={[{_key: key}]} />
            </Stack>
          </Card>
        )
      })}
      <Button
        ref={addButton}
        text="Legg til seksjon"
        mode="ghost"
        disabled={readOnly || count >= MAX_SECTIONS}
        onClick={addSection}
      />
    </Stack>
  )
}
