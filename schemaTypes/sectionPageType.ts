import {BlockContentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {SectionsInput, MAX_SECTIONS} from '../components/SectionsInput'
import {articleContentBlocks, blockNameField, sectionIconOptions} from './articleContentBlocks'
import {articleType} from './articleType'

export const pageSectionType = defineType({
  name: 'pageSection',
  title: 'Seksjon',
  type: 'object',
  icon: BlockContentIcon,
  options: {collapsible: false},
  fields: [
    blockNameField,
    defineField({name: 'heading', title: 'Overskrift (valgfritt)', type: 'string'}),
    defineField({
      name: 'icon',
      title: 'Ikon (valgfritt)',
      description: 'Velg et ikon fra Skatteetatens designsystem som skal vises ved seksjonen.',
      type: 'string',
      options: {list: sectionIconOptions},
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      type: 'array',
      of: articleContentBlocks,
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {name: 'blockName', heading: 'heading'},
    prepare: ({name, heading}) => ({title: name || heading || 'Seksjon'}),
  },
})

export const sectionPageType = defineType({
  name: 'sectionPage',
  title: 'Seksjonsside',
  type: 'document',
  icon: BlockContentIcon,
  groups: articleType.groups,
  fields: [
    ...articleType.fields.filter((field) => field.name !== 'content'),
    defineField({
      name: 'sections',
      title: 'Seksjoner',
      description: 'Legg til opptil 10 seksjoner. Feltene redigeres direkte under hverandre.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'pageSection'})],
      components: {input: SectionsInput},
      validation: (rule) => rule.required().min(1).max(MAX_SECTIONS),
    }),
  ],
  preview: articleType.preview,
})
