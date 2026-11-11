import type {ArrayOfObjectsInputProps} from 'sanity'

export function ContentBuilderInput(props: ArrayOfObjectsInputProps) {
  // Keep the legacy member schema for existing content, but exclude it from insert menus.
  const schemaType = {
    ...props.schemaType,
    of: props.schemaType.of.filter(
      (member) =>
        member.name !== 'krise' &&
        member.name !== 'bildeOgTekst' &&
        !('to' in member && member.to.some((target) => target.name === 'sharedContent')),
    ),
  }

  return props.renderDefault({
    ...props,
    schemaType,
    members: props.members.map((member) =>
      member.kind === 'item' ? {...member, parentSchemaType: schemaType} : member,
    ),
  })
}
