import {
  BlockContentIcon,
  EarthGlobeIcon,
  ErrorOutlineIcon,
  ThLargeIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {blockNameField, panelTextBlock} from './articleContentBlocks'
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

const iconOptions = [
  {title: 'Informasjon', value: 'info'},
  {title: 'Hjelp', value: 'help'},
  {title: 'Fullført', value: 'completed'},
  {title: 'Frist/dato', value: 'calendar'},
  {title: 'Tid', value: 'clock'},
  {title: 'Varsel', value: 'bell'},
  {title: 'Personvern/sikkerhet', value: 'lock'},
] as const

// Innholdsblokkene som kan brukes direkte på artikkelen og inne i en seksjon.
// Funksjon slik at hver array får sine egne definisjoner.
const contentMembers = () => [
    defineArrayMember({type: 'tekst'}),
    defineArrayMember({type: 'bilde'}),
    defineArrayMember({type: 'informasjon'}),
    defineArrayMember({
      type: 'reference',
      to: [{type: 'sharedContent'}],
    }),
    defineArrayMember({
      name: 'varsel',
      title: 'Varsel',
      type: 'object',
      icon: ErrorOutlineIcon,
      fields: [
        blockNameField,
        defineField({
          name: 'heading',
          title: 'Overskrift',
          type: 'string',
        }),
        defineField({
          name: 'text',
          title: 'Innhold',
          description: 'Ren tekst, uthevet tekst (fet/kursiv), lenker og underoverskrift.',
          type: 'array',
          of: [panelTextBlock],
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: {blockName: 'blockName', title: 'heading', blocks: 'text'},
        prepare({blockName, title, blocks}) {
          return {
            title: blockName || title || 'Varsel',
            subtitle: blockText(blocks),
          }
        },
      },
    }),
    defineArrayMember({
      name: 'krise',
      title: 'Krise',
      type: 'object',
      icon: WarningOutlineIcon,
      fields: [
        blockNameField,
        defineField({
          name: 'heading',
          title: 'Overskrift',
          type: 'string',
        }),
        defineField({
          name: 'text',
          title: 'Innhold',
          description: 'Ren tekst, uthevet tekst (fet/kursiv), lenker og underoverskrift.',
          type: 'array',
          of: [panelTextBlock],
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: {blockName: 'blockName', title: 'heading', blocks: 'text'},
        prepare({blockName, title, blocks}) {
          return {
            title: blockName || title || 'Krise',
            subtitle: blockText(blocks),
          }
        },
      },
    }),
    defineArrayMember({type: 'rettskilderPanel'}),
]

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
              type: 'string',
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
      description: 'Bygg opp artikkelen med lokale blokker eller innhold som deles på tvers av artikler.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          name: 'seksjon',
          title: 'Seksjon',
          type: 'object',
          icon: ThLargeIcon,
          fields: [
            blockNameField,
            defineField({
              name: 'heading',
              title: 'Overskrift (valgfritt)',
              type: 'string',
            }),
            defineField({
              name: 'icon',
              title: 'Ikon (valgfritt)',
              type: 'string',
              description: 'Velg et ikon fra Skatteetatens designsystem som skal vises ved seksjonen.',
              options: {list: [...iconOptions], layout: 'dropdown'},
            }),
            defineField({
              name: 'content',
              title: 'Innhold',
              description: 'Samme typer innhold som direkte på artikkelen, bortsett fra seksjoner.',
              type: 'array',
              of: contentMembers(),
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: {
            select: {blockName: 'blockName', title: 'heading', content: 'content'},
            prepare({blockName, title, content}) {
              const count = Array.isArray(content) ? content.length : 0
              return {
                title: blockName || title || 'Seksjon',
                subtitle: `Seksjon · ${count} ${count === 1 ? 'blokk' : 'blokker'}`,
              }
            },
          },
        }),
        ...contentMembers(),
      ],
      validation: (rule) =>
        rule.required().min(1).custom((blocks) => {
          const types = Array.isArray(blocks) ? blocks.map((block) => (block as {_type?: string})._type) : []
          const hasSection = types.includes('seksjon')
          const hasOther = types.some((type) => type !== 'seksjon')
          return hasSection && hasOther
            ? 'Når artikkelen inneholder seksjoner, må alt innhold ligge i seksjoner. Flytt eller fjern blokkene utenfor seksjonene.'
            : true
        }),
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
