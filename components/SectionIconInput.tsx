import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {set, unset, type StringInputProps} from 'sanity'
import {sectionIconOptions} from './SectionIcons'

export function SectionIconInput({id, value, onChange, readOnly}: StringInputProps) {
  const selected = sectionIconOptions.find((option) => option.value === value)

  return (
    <MenuButton
      id={`${id}-menu`}
      button={
        <Button
          id={id}
          mode="ghost"
          padding={3}
          width="fill"
          justify="flex-start"
          disabled={readOnly}
          aria-label={selected ? `Ikon: ${selected.title}` : 'Velg ikon'}
        >
          <Flex align="center" gap={3}>
            {selected ? <selected.Icon size="medium" /> : null}
            <Box flex={1}>
              <Text muted={!selected}>{selected?.title ?? 'Velg ikon'}</Text>
            </Box>
            <Text>
              <ChevronDownIcon />
            </Text>
          </Flex>
        </Button>
      }
      menu={
        <Menu style={{maxHeight: '40vh', overflowY: 'auto'}}>
          <MenuItem
            text="Ingen ikon"
            pressed={!value}
            disabled={readOnly}
            onClick={() => onChange(unset())}
          />
          {sectionIconOptions.map(({title, value: optionValue, Icon}) => (
            <MenuItem
              key={optionValue}
              pressed={value === optionValue}
              disabled={readOnly}
              onClick={() => onChange(set(optionValue))}
            >
              <Flex align="center" gap={3}>
                <Icon size="medium" />
                <Text>{title}</Text>
              </Flex>
            </MenuItem>
          ))}
        </Menu>
      }
      popover={{matchReferenceWidth: true, portal: true, placement: 'top-start'}}
    />
  )
}
