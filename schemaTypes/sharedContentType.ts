import {BlockContentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const sharedContentType = defineType({
  name: 'sharedContent',
  title: 'Delt innhold',
  type: 'document',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Navn',
      description: 'Navn som vises i referansevelgeren.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      description: 'Vises på alle artikler som bruker innholdet.',
      type: 'array',
      of: [
        defineArrayMember({type: 'tekst'}),
        defineArrayMember({type: 'informasjon'}),
        defineArrayMember({type: 'bilde'}),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', blocks: 'content'},
    prepare({title, blocks}) {
      return {
        title: title || 'Delt innhold',
        subtitle: `${blocks?.length || 0} innholdsblokker`,
      }
    },
  },
})
