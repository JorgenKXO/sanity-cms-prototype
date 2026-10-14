import {BlockContentIcon, EarthGlobeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {articleContentBlocks} from './articleContentBlocks'
export {articleTextBlock} from './articleContentBlocks'

import {kategoriOptions} from './kategoriOptions'

type PortableTextBlockPreview = {
  _type: string
  children?: {text?: string}[]
}

function blockText(blocks?: PortableTextBlockPreview[]) {
  const firstBlock = blocks?.find((block) => block._type === 'block')
  return firstBlock?.children?.map((child) => child.text || '').join('') || ''
}

// Ingressen tillater kun ren tekst, uten formatering eller lenker.
const ingressBlock = defineArrayMember({
  type: 'block',
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [],
    annotations: [],
  },
})

export const articleType = defineType({
  name: 'article',
  title: 'Artikkel',
  type: 'document',
  groups: [
    {name: 'content', title: 'Hovedinnhold', icon: BlockContentIcon},
    {name: 'navigationSeo', title: 'Kategori og SEO', icon: EarthGlobeIcon},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Nettadresse',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ingress',
      title: 'Ingress',
      description:
        'Kort innledende avsnitt som vises under tittelen. Kun ren tekst, uten lenker eller formatering.',
      type: 'array',
      of: [ingressBlock],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'breadcrumbs',
      title: 'Brødsmulesti',
      type: 'array',
      group: 'navigationSeo',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etikett',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Nettadresse',
              type: 'url',
              validation: (rule) =>
                rule.uri({
                  allowRelative: true,
                  scheme: ['http', 'https', 'mailto', 'tel'],
                }),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'href'},
          },
        }),
      ],
    }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      description: 'Hvilken tematisk mappe artikkelen hører til.',
      type: 'string',
      group: 'navigationSeo',
      options: {
        list: [...kategoriOptions],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      description: 'Bygg opp artikkelen ved å legge til tekst-, bilde- og boksblokker.',
      type: 'array',
      group: 'content',
      of: articleContentBlocks,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Sist oppdatert',
      type: 'date',
      group: 'navigationSeo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      ingress: 'ingress',
    },
    prepare({title, ingress}) {
      return {
        title,
        subtitle: blockText(ingress),
      }
    },
  },
})
