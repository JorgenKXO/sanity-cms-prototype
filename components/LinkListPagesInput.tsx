import type {ArrayOfObjectsInputProps} from 'sanity'

export function LinkListPagesInput(props: ArrayOfObjectsInputProps) {
  // Keep legacy references in the schema, but only offer new link objects for insertion.
  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      of: props.schemaType.of.filter((member) => member.name === 'linkListItem'),
    },
  })
}
