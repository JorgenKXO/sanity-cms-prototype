import {BlockContentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {ContentBuilderInput} from '../components/ContentBuilderInput'
import {SectionIconInput} from '../components/SectionIconInput'
import {articleContentBlocks, sectionIconOptions} from './articleContentBlocks'
import {articleType} from './articleType'

export const MAX_SECTIONS = 10

export const pageSectionType = defineType({
  name: 'pageSection',
  title: 'Seksjon',
  type: 'object',
  icon: BlockContentIcon,
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'heading', title: 'Overskrift (valgfritt)', type: 'string'}),
    defineField({
      name: 'icon',
      title: 'Ikon (valgfritt)',
      type: 'string',
      options: {list: sectionIconOptions.map(({title, value}) => ({title, value}))},
      components: {input: SectionIconInput},
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      type: 'array',
      components: {input: ContentBuilderInput},
      of: articleContentBlocks,
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {heading: 'heading', content: 'content'},
    prepare: ({heading, content}) => {
      const count = Array.isArray(content) ? content.length : 0
      return {
        title: heading || 'Seksjon',
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
      description: 'Maks. 10 seksjoner.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'pageSection'})],
      validation: (rule) => rule.required().min(1).max(MAX_SECTIONS),
    }),
  ],
  preview: articleType.preview,
})
