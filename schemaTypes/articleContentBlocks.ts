import {
  ArrowRightIcon,
  ChevronDownIcon,
  ImageIcon,
  InfoOutlineIcon,
  LinkIcon,
  TextIcon,
  UlistIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {ButtonDestinationInput} from '../components/ButtonDestinationInput'
import {LinkListPagesInput} from '../components/LinkListPagesInput'
import {SectionIconInput} from '../components/SectionIconInput'
import {sectionIconOptions} from '../components/SectionIcons'
export {sectionIconOptions}

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

const examplePageLinkAnnotation = {
  name: 'pageLink',
  title: 'Lenke',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'page',
      title: 'Side',
      type: 'reference',
      to: [{type: 'article'}, {type: 'sectionPage'}, {type: 'navigationPage'}],
      validation: (rule) => rule.required(),
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

const exampleTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Underoverskrift (h2)', value: 'h2'},
    {title: 'Underoverskrift (h3)', value: 'h3'},
  ],
  lists: [
    {title: 'Kulepunktliste', value: 'bullet'},
    {title: 'Nummerert liste', value: 'number'},
  ],
  marks: {
    decorators: [{title: 'Fet', value: 'strong'}, {title: 'Kursiv', value: 'em'}],
    annotations: [examplePageLinkAnnotation],
  },
})

const nestedRichTextContentBlocks = [
  exampleTextBlock,
  defineArrayMember({type: 'openClose'}),
  defineArrayMember({type: 'bilde'}),
  defineArrayMember({type: 'eksempel'}),
  defineArrayMember({type: 'knapp'}),
  defineArrayMember({type: 'lenkeliste'}),
]

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

export const informationPanelTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Underoverskrift (h2)', value: 'h2'},
    {title: 'Underoverskrift (h3)', value: 'h3'},
  ],
  lists: [
    {title: 'Kulepunktliste', value: 'bullet'},
    {title: 'Nummerert liste', value: 'number'},
  ],
  marks: {
    decorators: [
      {title: 'Fet', value: 'strong'},
      {title: 'Kursiv', value: 'em'},
    ],
    annotations: [linkAnnotation],
  },
})

export const informationPanelContentBlocks = [
  informationPanelTextBlock,
  defineArrayMember({type: 'openClose'}),
  defineArrayMember({type: 'accordionGroup'}),
  defineArrayMember({type: 'knapp'}),
  defineArrayMember({type: 'lenkeliste'}),
]

export const warningPanelContentBlocks = informationPanelContentBlocks.filter(
  (member) => member.type !== 'accordionGroup',
)

export const articleLinkListContentBlockType = defineType({
  name: 'lenkeliste',
  title: 'Lenkeliste',
  type: 'object',
  icon: UlistIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift (valgfritt)',
      type: 'string',
    }),
    defineField({
      name: 'ingress',
      title: 'Ingress (valgfritt)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'pages',
      title: 'Sider',
      description:
        'Legg til lenker i ønsket rekkefølge. Velg en Sanity-side og fyll eventuelt inn egen lenketekst. Du kan legge til så mange lenker du vil.',
      type: 'array',
      components: {input: LinkListPagesInput},
      of: [
        defineArrayMember({
          name: 'linkListItem',
          title: 'Lenke',
          type: 'object',
          icon: ArrowRightIcon,
          fields: [
            defineField({
              name: 'page',
              title: 'Side',
              type: 'reference',
              to: [{type: 'article'}, {type: 'sectionPage'}, {type: 'navigationPage'}],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Lenketekst (valgfritt)',
              description: 'La feltet stå tomt for å bruke sidens originaltittel.',
              type: 'string',
            }),
          ],
          preview: {
            select: {label: 'label', pageTitle: 'page.title'},
            prepare({label, pageTitle}) {
              return {
                title: label?.trim() || pageTitle || 'Velg en side',
                subtitle: label?.trim() ? pageTitle || 'Lenke' : 'Lenke · bruker sidens tittel',
              }
            },
          },
        }),
        defineArrayMember({
          title: 'Side (uten egen lenketekst)',
          type: 'reference',
          to: [{type: 'article'}, {type: 'sectionPage'}, {type: 'navigationPage'}],
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {heading: 'heading', pages: 'pages'},
    prepare({heading, pages}) {
      const count = Array.isArray(pages) ? pages.length : 0
      return {
        title: heading?.trim() || 'Lenkeliste',
        subtitle: `Lenkeliste · ${count} ${count === 1 ? 'lenke' : 'lenker'}`,
      }
    },
  },
})

export const articleTextContentBlockType = defineType({
  name: 'tekst',
  title: 'Tekst',
  type: 'object',
  icon: TextIcon,
  fields: [
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
    select: {blocks: 'text'},
    prepare({blocks}) {
      return {
        title: blockText(blocks) || 'Tekst',
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
    select: {media: 'image', alt: 'alt', isDecorative: 'isDecorative'},
    prepare({media, alt, isDecorative}) {
      return {
        title: isDecorative ? 'Bilde (dekorativt)' : alt || 'Bilde',
        media,
      }
    },
  },
})

export const articleImageTextContentBlockType = defineType({
  name: 'bildeOgTekst',
  title: 'Bilde og tekst',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      validation: (rule) => rule.required().error('Legg til en overskrift.'),
    }),
    defineField({
      name: 'image',
      title: 'Bilde eller illustrasjon',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isDecorative',
      title: 'Dekorativt bilde',
      type: 'boolean',
      description:
        'Slå på hvis bildet er rent dekorativt. Skjermlesere hopper da over bildet, og alternativ tekst er ikke nødvendig.',
      initialValue: false,
    }),
    defineField({
      name: 'alt',
      title: 'Alternativ tekst',
      description: 'Beskriv hva bildet viser, eller merk det som dekorativt.',
      type: 'string',
      hidden: ({parent}) => Boolean(parent?.isDecorative),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {isDecorative?: boolean} | undefined
          if (parent?.isDecorative) return true
          return value ? true : 'Legg til alternativ tekst, eller merk bildet som dekorativt.'
        }),
    }),
    defineField({
      name: 'color',
      title: 'Bakgrunnsfarge',
      type: 'string',
      options: {
        list: [
          {title: 'Blå', value: 'denim-10'},
          {title: 'Grønn', value: 'forest-10'},
          {title: 'Gul', value: 'ochre-10'},
          {title: 'Grå', value: 'graphite-10'},
          {title: 'Rød', value: 'burgundy-10'},
        ],
        layout: 'radio',
      },
      initialValue: 'denim-10',
      validation: (rule) => rule.required().error('Velg en bakgrunnsfarge.'),
    }),
    defineField({
      name: 'body',
      title: 'Tekst',
      description: 'Brødtekst, tekstlenker og lister.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [
            {title: 'Nummerert liste', value: 'number'},
            {title: 'Punktliste', value: 'bullet'},
          ],
          marks: {
            decorators: [
              {title: 'Fet', value: 'strong'},
              {title: 'Kursiv', value: 'em'},
            ],
            annotations: [linkAnnotation],
          },
        }),
      ],
      validation: (rule) => rule.required().min(1).error('Legg til tekstinnhold.'),
    }),
  ],
  preview: {
    select: {title: 'heading', media: 'image', color: 'color'},
    prepare({title, media, color}) {
      const colorTitles: Record<string, string> = {
        'denim-10': 'Blå',
        'forest-10': 'Grønn',
        'ochre-10': 'Gul',
        'graphite-10': 'Grå',
        'burgundy-10': 'Rød',
      }
      return {
        title: title || 'Bilde og tekst',
        subtitle: colorTitles[color || ''] || 'Bilde og tekst',
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
    select: {blocks: 'text', source: 'source'},
    prepare({blocks, source}) {
      return {
        title: blockText(blocks) || 'Sitat',
        subtitle: source || 'Sitat',
      }
    },
  },
})

export const articleExampleContentBlockType = defineType({
  name: 'eksempel',
  title: 'Eksempel',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'text',
      title: 'Innhold',
      description: 'Rik tekst med underoverskrifter, Sanity-lenker, lister og uthevet tekst.',
      type: 'array',
      of: [exampleTextBlock],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {blocks: 'text'},
    prepare({blocks}) {
      return {
        title: blockText(blocks) || 'Eksempel',
        subtitle: 'Eksempel',
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
      options: {list: sectionIconOptions.map(({title, value}) => ({title, value}))},
      components: {input: SectionIconInput},
    }),
    defineField({
      name: 'text',
      title: 'Innhold',
      description:
        'Normal tekst, underoverskrifter, uthevet tekst (fet/kursiv), lenker, lister, Åpne/Lukke, accordion-gruppe, knapp og lenkeliste.',
      type: 'array',
      of: informationPanelContentBlocks,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'heading', blocks: 'text'},
    prepare({title, blocks}) {
      return {
        title: title || 'Informasjon',
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
          components: {input: ButtonDestinationInput},
          fields: [
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
            defineField({
              name: 'label',
              title: 'Tekst for valget',
              description:
                'Vises på navigasjonskortet når knappen har flere mål. Fylles inn fra sidetittelen når feltet er tomt. Du kan endre teksten.',
              type: 'string',
              validation: (rule) => rule.required(),
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
    select: {label: 'label', appearance: 'appearance'},
    prepare({label, appearance}: {
      label?: string
      appearance?: string
    }) {
      const appearanceTitles: Record<string, string> = {
        secondary: 'Sekundærknapp',
        primary: 'Primærknapp',
        mega: 'Megaknapp',
      }
      return {
        title: label || 'Knapp',
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
    defineField({
      name: 'title',
      title: 'Overskrift',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      description:
        'Rik tekst med samme formateringsvalg som Accordion, samt bilde, eksempel, knapp og lenkeliste. Åpne/Lukke kan ikke inneholde en annen Åpne/Lukke.',
      type: 'array',
      of: nestedRichTextContentBlocks.filter((member) => member.type !== 'openClose'),
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Åpne/Lukke',
        subtitle: 'Åpne/Lukke',
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
              name: 'ingress',
              title: 'Ingress',
              description: 'Valgfri ingress som vises under overskriften.',
              type: 'string',
            }),
            defineField({
              name: 'content',
              title: 'Innhold',
              description:
                'Rik tekst med samme formateringsvalg som Eksempel, samt Åpne/Lukke, bilde, eksempel, knapp og lenkeliste.',
              type: 'array',
              of: nestedRichTextContentBlocks,
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
    select: {accordions: 'accordions'},
    prepare({accordions}) {
      const count = Array.isArray(accordions) ? accordions.length : 0
      return {
        title: 'Accordion-gruppe',
        subtitle: `${count} ${count === 1 ? 'accordion' : 'accordions'}`,
      }
    },
  },
})

export const articleContentBlocks = [
  defineArrayMember({type: 'tekst'}),
  defineArrayMember({type: 'bilde'}),
  defineArrayMember({type: 'bildeOgTekst'}),
  defineArrayMember({type: 'eksempel'}),
  defineArrayMember({type: 'informasjon'}),
  defineArrayMember({type: 'knapp'}),
defineArrayMember({
    name: 'varsel',
    title: 'Varselspanel',
    type: 'object',
    icon: WarningOutlineIcon,
    fields: [
      defineField({
        name: 'heading',
        title: 'Overskrift',
        type: 'string',
      }),
      defineField({
        name: 'text',
        title: 'Innhold',
        description:
          'Normal tekst, underoverskrifter, uthevet tekst (fet/kursiv), lenker, lister, Åpne/Lukke, knapp og lenkeliste.',
        type: 'array',
        of: warningPanelContentBlocks,
        validation: (rule) => rule.required(),
      }),
    ],
    preview: {
      select: {title: 'heading', blocks: 'text'},
      prepare({title, blocks}) {
        return {
          title: title || 'Varselspanel',
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
      select: {title: 'heading', blocks: 'text'},
      prepare({title, blocks}) {
        return {
          title: title || 'Krise',
          subtitle: blockText(blocks),
        }
      },
    },
  }),
defineArrayMember({type: 'rettskilderPanel'}),
defineArrayMember({type: 'openClose'}),
]
