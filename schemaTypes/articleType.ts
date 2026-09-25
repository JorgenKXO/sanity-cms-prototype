import {
  BlockContentIcon,
  EarthGlobeIcon,
  ErrorOutlineIcon,
  ImageIcon,
  InfoOutlineIcon,
  TextIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {kategoriOptions} from './kategoriOptions'

type PortableTextBlockPreview = {
  _type: string
  children?: {text?: string}[]
}

function blockText(blocks?: PortableTextBlockPreview[]) {
  const firstBlock = blocks?.find((block) => block._type === 'block')
  return firstBlock?.children?.map((child) => child.text || '').join('') || ''
}

const linkAnnotation = {
  name: 'link',
  title: 'Lenke',
  type: 'object',
  fields: [
    defineField({
      name: 'href',
      title: 'Nettadresse',
      type: 'string',
      validation: (rule) =>
        rule.required().uri({
          allowRelative: true,
          scheme: ['http', 'https', 'mailto', 'tel'],
        }),
    }),
  ],
}

// Fri tekst til den vanlige "Tekst"-blokken: overskrifter, lister og lenker.
const articleTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Overskrift 2', value: 'h2'},
    {title: 'Overskrift 3', value: 'h3'},
  ],
  lists: [
    {title: 'Punktliste', value: 'bullet'},
    {title: 'Nummerert liste', value: 'number'},
  ],
  marks: {
    annotations: [linkAnnotation],
  },
})

// Ingressen tillater kun lenker, ingen annen formatering.
const ingressBlock = defineArrayMember({
  type: 'block',
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [],
    annotations: [linkAnnotation],
  },
})

// Enklere tekst til varsel-/informasjonsboksene: kun underoverskrift og lenker.
const panelTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Underoverskrift', value: 'h3'},
  ],
  lists: [],
  marks: {
    annotations: [linkAnnotation],
  },
})

// Valgfritt redaktørnavn som vises i innholdslisten i stedet for det automatiske forhåndsvisningsnavnet.
// Vises ikke i den publiserte artikkelen. Hvis feltet er tomt, brukes gjeldende forhåndsvisningslogikk.
const blockNameField = defineField({
  name: 'blockName',
  title: 'Navn (valgfritt)',
  description:
    'Gi blokken et gjenkjennelig navn som vises i innholdslisten, slik at det blir enklere å orientere seg. Vises ikke for besøkende på nettsiden.',
  type: 'string',
})

export const articleType = defineType({
  name: 'article',
  title: 'Artikkel',
  type: 'document',
  groups: [
    {name: 'content', title: 'Hovedinnhold', icon: BlockContentIcon},
    {name: 'navigationSeo', title: 'Navigasjon og SEO', icon: EarthGlobeIcon},
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
        'Kort innledende avsnitt som vises under tittelen. Lenker er tillatt, men ingen annen formatering (ingen fet/kursiv skrift, overskrifter eller lister).',
      type: 'array',
      of: [ingressBlock],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      description: 'Hvilken tematisk mappe artikkelen hører til.',
      type: 'string',
      options: {
        list: [...kategoriOptions],
        layout: 'dropdown',
      },
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
      name: 'content',
      title: 'Innhold',
      description: 'Bygg opp artikkelen ved å legge til tekst-, bilde- og varselblokker.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          name: 'tekst',
          title: 'Tekst',
          type: 'object',
          icon: TextIcon,
          fields: [
            blockNameField,
            defineField({
              name: 'text',
              title: 'Tekst',
              description: 'Rik tekst med overskrifter, lister og lenker.',
              type: 'array',
              of: [articleTextBlock],
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {blockName: 'blockName', blocks: 'text'},
            prepare({blockName, blocks}) {
              return {
                title: blockName || blockText(blocks) || 'Tekst',
                subtitle: 'Tekst',
              }
            },
          },
        }),
        defineArrayMember({
          name: 'bilde',
          title: 'Bilde',
          type: 'object',
          icon: ImageIcon,
          fields: [
            blockNameField,
            defineField({
              name: 'image',
              title: 'Bilde',
              type: 'image',
              options: {hotspot: true},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'isDecorative',
              title: 'Dekorativt bilde',
              type: 'boolean',
              description:
                'Slå på hvis bildet er rent dekorativt og ikke formidler informasjon som er viktig for innholdet. Skjermlesere hopper da over bildet, og alternativ tekst er ikke nødvendig.',
              initialValue: false,
            }),
            defineField({
              name: 'alt',
              title: 'Alternativ tekst',
              description: 'Beskriv hva bildet viser, slik at skjermlesere kan formidle innholdet til brukeren.',
              type: 'string',
              hidden: ({parent}) => Boolean(parent?.isDecorative),
              validation: (rule) =>
                rule.custom((value, context) => {
                  const parent = context.parent as {isDecorative?: boolean} | undefined
                  if (parent?.isDecorative) {
                    return true
                  }
                  return value ? true : 'Legg til alternativ tekst, eller merk bildet som dekorativt.'
                }),
            }),
          ],
          preview: {
            select: {media: 'image', alt: 'alt', isDecorative: 'isDecorative', blockName: 'blockName'},
            prepare({media, alt, isDecorative, blockName}) {
              return {
                title: blockName || (isDecorative ? 'Bilde (dekorativt)' : alt || 'Bilde'),
                media,
              }
            },
          },
        }),
        defineArrayMember({
          name: 'informasjon',
          title: 'Informasjon',
          type: 'object',
          icon: InfoOutlineIcon,
          fields: [
            blockNameField,
            defineField({
              name: 'heading',
              title: 'Overskrift',
              type: 'string',
            }),
            defineField({
              name: 'color',
              title: 'Bakgrunnsfarge',
              type: 'string',
              options: {
                list: [
                  {title: 'Blå bakgrunn', value: 'denim'},
                  {title: 'Grønn bakgrunn', value: 'forest'},
                  {title: 'Hvit bakgrunn med blå ramme', value: 'denim-outline'},
                  {title: 'Hvit bakgrunn med grønn ramme', value: 'forest-outline'},
                  {title: 'Hvit bakgrunn', value: 'white'},
                ],
                layout: 'dropdown',
              },
              initialValue: 'denim',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Ikon',
              type: 'string',
              description:
                'Valgfritt. Velg et ikon fra Skatteetatens designsystem som skal vises ved siden av overskriften.',
              options: {
                list: [
                  {title: 'Informasjon', value: 'info'},
                  {title: 'Hjelp', value: 'help'},
                  {title: 'Fullført', value: 'completed'},
                  {title: 'Frist/dato', value: 'calendar'},
                  {title: 'Tid', value: 'clock'},
                  {title: 'Varsel', value: 'bell'},
                  {title: 'Personvern/sikkerhet', value: 'lock'},
                ],
                layout: 'dropdown',
              },
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
                title: blockName || title || 'Informasjon',
                subtitle: blockText(blocks),
              }
            },
          },
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
      ],
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
