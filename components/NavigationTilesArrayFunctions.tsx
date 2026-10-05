import {AddIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem, Stack} from '@sanity/ui'
import type {ArraySchemaType} from '@sanity/types'
import type {ArrayInputFunctionsProps, ObjectItem} from 'sanity'

export function NavigationTilesArrayFunctions(
  props: ArrayInputFunctionsProps<ObjectItem, ArraySchemaType>,
) {
  const {onItemAppend, onValueCreate, schemaType} = props

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
          </Menu>
        }
      />
    </Stack>
  )
}
