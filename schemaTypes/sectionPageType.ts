import {BlockContentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {SectionIconInput} from '../components/SectionIconInput'
import {articleContentBlocks, blockNameField, sectionIconOptions} from './articleContentBlocks'
import {articleType} from './articleType'

export const MAX_SECTIONS = 10

export const pageSectionType = defineType({
  name: 'pageSection',
  title: 'Seksjon',
  type: 'object',
  icon: BlockContentIcon,
  options: {collapsible: true, collapsed: true},
  fields: [
    blockNameField,
    defineField({name: 'heading', title: 'Overskrift (valgfritt)', type: 'string'}),
    defineField({
      name: 'icon',
      title: 'Ikon (valgfritt)',
      description: 'Velg et ikon fra Skatteetatens designsystem som skal vises ved seksjonen.',
      type: 'string',
      options: {list: sectionIconOptions.map(({title, value}) => ({title, value}))},
      components: {input: SectionIconInput},
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
    select: {name: 'blockName', heading: 'heading', content: 'content'},
    prepare: ({name, heading, content}) => {
      const count = Array.isArray(content) ? content.length : 0
      return {
        title: name || heading || 'Seksjon',
        subtitle: `Seksjon · ${count} ${count === 1 ? 'blokk' : 'blokker'}`,
      }
    },
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
      description: 'Bygg opp siden med opptil 10 seksjoner.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'pageSection'})],
      validation: (rule) => rule.required().min(1).max(MAX_SECTIONS),
    }),
  ],
  preview: articleType.preview,
})
