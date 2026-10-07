import type {ArrayOfObjectsInputProps} from 'sanity'
import {NavigationTilesArrayFunctions} from './NavigationTilesArrayFunctions'

export function NavigationContentInput(props: ArrayOfObjectsInputProps) {
  // Keep legacy member schemas for editing, but exclude them from all insert menus.
  const schemaType = {
    ...props.schemaType,
    of: props.schemaType.of.filter(
      (member) => member.name !== 'navigationGroupHeading' && member.name !== 'navigationTilePage',
    ),
  }

  return props.renderDefault({
    ...props,
    schemaType,
    arrayFunctions: NavigationTilesArrayFunctions,
    members: props.members.map((member) =>
      member.kind === 'item' ? {...member, parentSchemaType: schemaType} : member,
    ),
  })
}
