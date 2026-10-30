import {
  ArrowRightIcon,
  ChevronDownIcon,
  ErrorOutlineIcon,
  ImageIcon,
  InfoOutlineIcon,
  TextIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

type PortableTextBlockPreview = {
  _type: string
  children?: {text?: string}[]
}

function blockText(blocks?: PortableTextBlockPreview[]) {
  const firstBlock = blocks?.find((block) => block._type === 'block')
  return firstBlock?.children?.map((child) => child.text || '').join('') || ''
}

export const linkAnnotation = {
  name: 'link',
  title: 'Lenke',
  type: 'object',
  fields: [
    defineField({
      name: 'href',
      title: 'Nettadresse',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({
          allowRelative: true,
          scheme: ['http', 'https', 'mailto', 'tel'],
        }),
    }),
  ],
}

export const articleTextBlock = defineArrayMember({
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

export const panelTextBlock = defineArrayMember({
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

export const blockNameField = defineField({
  name: 'blockName',
  title: 'Navn (valgfritt)',
  description:
    'Gi blokken et gjenkjennelig navn som vises i innholdslisten, slik at det blir enklere å orientere seg. Vises ikke for besøkende på nettsiden.',
  type: 'string',
})

export const articleTextContentBlockType = defineType({
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
})

export const articleImageContentBlockType = defineType({
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
})

export const articleBlockquoteContentBlockType = defineType({
  name: 'sitat',
  title: 'Sitat',
  type: 'object',
  icon: TextIcon,
  fields: [
    blockNameField,
    defineField({
      name: 'text',
      title: 'Sitat',
      type: 'array',
      of: [defineArrayMember({
        type: 'block',
        styles: [{title: 'Normal', value: 'normal'}],
        lists: [],
        marks: {
          decorators: [{title: 'Fet', value: 'strong'}, {title: 'Kursiv', value: 'em'}],
          annotations: [linkAnnotation],
        },
      })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'source',
      title: 'Kilde (valgfritt)',
      type: 'string',
    }),
    defineField({
      name: 'borderColor',
      title: 'Farge på venstre strek',
      type: 'string',
      options: {
        list: [
          {title: 'Gul', value: 'ochre'},
          {title: 'Grønn', value: 'forest'},
          {title: 'Blå', value: 'denim'},
          {title: 'Grå', value: 'graphite'},
        ],
        layout: 'dropdown',
      },
      initialValue: 'ochre',
    }),
  ],
  preview: {
    select: {blockName: 'blockName', blocks: 'text', source: 'source'},
    prepare({blockName, blocks, source}) {
      return {
        title: blockName || blockText(blocks) || 'Sitat',
        subtitle: source || 'Sitat',
      }
    },
  },
})

export const articleInformationContentBlockType = defineType({
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
})

export const articleButtonContentBlockType = defineType({
  name: 'knapp',
  title: 'Knapp',
  type: 'object',
  icon: ArrowRightIcon,
  fields: [
    blockNameField,
    defineField({
      name: 'label',
      title: 'Lenketekst',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'appearance',
      title: 'Utseende',
      description:
        'Bruk megaknapp for én tydelig hovedhandling. Velg primær- eller sekundærknapp for øvrige lenker.',
      type: 'string',
      options: {
        list: [
          {title: 'Sekundærknapp', value: 'secondary'},
          {title: 'Primærknapp', value: 'primary'},
          {title: 'Megaknapp', value: 'mega'},
        ],
        layout: 'radio',
      },
      initialValue: 'secondary',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'destinations',
      title: 'Lenkemål',
      description:
        'Legg til Sanity-sider og filer i ønsket rekkefølge. Flere mål åpner en modal. For eksisterende knapper erstatter denne listen det gamle lenkemålet når du legger til valg.',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'buttonDestination',
          title: 'Lenkemål',
          type: 'object',
          icon: ArrowRightIcon,
          fields: [
            defineField({
              name: 'label',
              title: 'Tekst for valget',
              description: 'Vises på navigasjonskortet når knappen har flere mål.',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'linkType',
              title: 'Lenketype',
              type: 'string',
              options: {
                list: [
                  {title: 'Sanity-side', value: 'internal'},
                  {title: 'Vedlegg/fil for nedlasting', value: 'file'},
                ],
                layout: 'radio',
              },
              initialValue: 'internal',
              validation: (rule) => rule.required().custom((value) =>
                value === 'external'
                  ? 'Eksterne lenker er ikke lenger tillatt. Velg en Sanity-side eller fil, eller fjern lenkemålet.'
                  : true),
            }),
            defineField({
              name: 'page',
              title: 'Side',
              type: 'reference',
              to: [{type: 'article'}, {type: 'sectionPage'}, {type: 'navigationPage'}],
              hidden: ({parent}) => parent?.linkType !== 'internal',
              validation: (rule) => rule.custom((value, context) => {
                const parent = context.parent as {linkType?: string} | undefined
                return parent?.linkType !== 'internal' || value?._ref
                  ? true : 'Velg en Sanity-side.'
              }),
            }),
            defineField({
              name: 'url',
              title: 'Nettadresse',
              type: 'url',
              deprecated: {reason: 'Eksterne lenker er ikke lenger tillatt på knapper.'},
              readOnly: true,
              hidden: ({parent, value}) => parent?.linkType !== 'external' || !value,
            }),
            defineField({
              name: 'file',
              title: 'Vedlegg/fil',
              type: 'file',
              hidden: ({parent}) => parent?.linkType !== 'file',
              validation: (rule) => rule.custom((value, context) => {
                const parent = context.parent as {linkType?: string} | undefined
                return parent?.linkType !== 'file' || value?.asset?._ref
                  ? true : 'Last opp eller velg en fil.'
              }),
            }),
          ],
          preview: {
            select: {title: 'label', linkType: 'linkType'},
            prepare({title, linkType}) {
              const titles: Record<string, string> = {
                internal: 'Sanity-side',
                external: 'Ekstern nettside (må erstattes eller fjernes)',
                file: 'Vedlegg/fil for nedlasting',
              }
              return {title: title || 'Lenkemål', subtitle: titles[linkType] || 'Velg lenketype'}
            },
          },
        }),
      ],
      validation: (rule) => rule.custom((value, context) => {
        const parent = context.parent as {linkType?: string} | undefined
        return value?.length || parent?.linkType
          ? true : 'Legg til minst ett lenkemål.'
      }),
    }),
    defineField({
      name: 'linkType',
      title: 'Lenketype',
      type: 'string',
      description: 'Tidligere lenketype. Bruk Lenkemål for å erstatte den gamle lenken.',
      readOnly: true,
      hidden: ({parent}) => !parent?.linkType || Boolean(parent?.destinations?.length),
      validation: (rule) => rule.custom((value, context) => {
        const parent = context.parent as {destinations?: unknown[]} | undefined
        return value === 'external' && !parent?.destinations?.length
          ? 'Eksterne lenker er ikke lenger tillatt. Legg til en Sanity-side eller fil under Lenkemål.'
          : true
      }),
    }),
    defineField({
      name: 'url',
      title: 'Nettadresse',
      type: 'url',
      deprecated: {reason: 'Eksterne lenker er ikke lenger tillatt på knapper.'},
      readOnly: true,
      hidden: ({parent, value}) =>
        parent?.linkType !== 'external' || Boolean(parent?.destinations?.length) || !value,
    }),
    defineField({
      name: 'page',
      title: 'Side',
      type: 'reference',
      to: [{type: 'article'}, {type: 'sectionPage'}, {type: 'navigationPage'}],
      hidden: ({parent}) => parent?.linkType !== 'internal' || Boolean(parent?.destinations?.length),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {linkType?: string; destinations?: unknown[]} | undefined
          if (parent?.destinations?.length || parent?.linkType !== 'internal' || value) return true
          return 'Velg en Sanity-side.'
        }),
    }),
  ],
  preview: {
    select: {blockName: 'blockName', label: 'label', appearance: 'appearance'},
    prepare({blockName, label, appearance}: {
      blockName?: string
      label?: string
      appearance?: string
    }) {
      const appearanceTitles: Record<string, string> = {
        secondary: 'Sekundærknapp',
        primary: 'Primærknapp',
        mega: 'Megaknapp',
      }
      return {
        title: blockName || label || 'Knapp',
        subtitle: appearanceTitles[appearance || ''] || 'Knapp',
      }
    },
  },
})

export const articleOpenCloseContentBlockType = defineType({
  name: 'openClose',
  title: 'Åpne/Lukke',
  type: 'object',
  icon: ChevronDownIcon,
  fields: [
    blockNameField,
    defineField({
      name: 'title',
      title: 'Overskrift',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'size',
      title: 'Størrelse',
      type: 'string',
      options: {
        list: [
          {title: 'Liten', value: 'small'},
          {title: 'Middels', value: 'medium'},
          {title: 'Stor', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'large',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      type: 'array',
      of: [articleTextBlock],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {blockName: 'blockName', title: 'title', size: 'size'},
    prepare({blockName, title, size}) {
      const sizeTitles: Record<string, string> = {
        small: 'Liten',
        medium: 'Middels',
        large: 'Stor',
      }
      return {
        title: blockName || title || 'Åpne/Lukke',
        subtitle: `Åpne/Lukke · ${sizeTitles[size || ''] || 'Velg størrelse'}`,
      }
    },
  },
})

export const articleAccordionGroupContentBlockType = defineType({
  name: 'accordionGroup',
  title: 'Accordion-gruppe',
  type: 'object',
  icon: ChevronDownIcon,
  fields: [
    blockNameField,
    defineField({
      name: 'showNumbers',
      title: 'Vis med tall',
      description: 'Vis et tall til venstre for hver accordion, med en linje mellom tallene.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'accordions',
      title: 'Accordioner',
      description: 'Legg til accordionene som skal inngå i gruppen.',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'accordion',
          title: 'Accordion',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Overskrift',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'content',
              title: 'Innhold',
              description: 'Tekst og Åpne/Lukke-objekter.',
              type: 'array',
              of: [articleTextBlock, defineArrayMember({type: 'openClose'})],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: {
            select: {title: 'title'},
            prepare({title}) {
              return {title: title || 'Accordion'}
            },
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {blockName: 'blockName', accordions: 'accordions'},
    prepare({blockName, accordions}) {
      const count = Array.isArray(accordions) ? accordions.length : 0
      return {
        title: blockName || 'Accordion-gruppe',
        subtitle: `${count} ${count === 1 ? 'accordion' : 'accordions'}`,
      }
    },
  },
})

export const sectionIconOptions = [
  {title: 'Informasjon', value: 'info'},
  {title: 'Hjelp', value: 'help'},
  {title: 'Fullført', value: 'completed'},
  {title: 'Frist/dato', value: 'calendar'},
  {title: 'Tid', value: 'clock'},
  {title: 'Varsel', value: 'bell'},
  {title: 'Personvern/sikkerhet', value: 'lock'},
]

export const articleContentBlocks = [
  defineArrayMember({type: 'tekst'}),
  defineArrayMember({type: 'bilde'}),
  defineArrayMember({type: 'sitat'}),
  defineArrayMember({type: 'informasjon'}),
  defineArrayMember({type: 'knapp'}),
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
defineArrayMember({type: 'openClose'}),
]
