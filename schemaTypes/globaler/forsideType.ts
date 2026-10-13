import {
  BlockContentIcon,
  DocumentIcon,
  ImageIcon,
  MasterDetailIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {
  HomepageIconInput,
  homepageIconOptions,
  normalizeHomepageIconValue,
} from '../../components/HomepageIconInput'
import {articleTextBlock} from '../articleContentBlocks'
import {navigationTileFields} from '../shared/navigationTileFields'

export const forsideNavigasjonskortType = defineType({
  name: 'forsideNavigasjonskort',
  title: 'Navigasjonskort',
  type: 'object',
  icon: DocumentIcon,
  fields: [
    ...navigationTileFields,
    defineField({
      name: 'icon',
      title: 'Ikon',
      type: 'string',
      description: 'Velg et ikon fra Skatteetatens forsider.',
      options: {
        list: homepageIconOptions.map(({title, value}) => ({title, value})),
      },
      components: {input: HomepageIconInput},
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'titleOverride', pageTitle: 'page.title', icon: 'icon'},
    prepare({title, pageTitle, icon}) {
      const selectedValue = normalizeHomepageIconValue(icon)
      const iconTitle = homepageIconOptions.find((option) => option.value === selectedValue)?.title
      return {
        title: title || pageTitle || 'Navigasjonskort',
        subtitle: iconTitle ? `Navigasjonskort · ${iconTitle}` : 'Navigasjonskort',
      }
    },
  },
})

export const forsideNavigasjonsgruppeType = defineType({
  name: 'forsideNavigasjonsgruppe',
  title: 'Gruppe navigasjonskort',
  type: 'object',
  icon: MasterDetailIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Overskrift (valgfritt)',
      type: 'string',
    }),
    defineField({
      name: 'tiles',
      title: 'Navigasjonskort',
      type: 'array',
      of: [defineArrayMember({type: 'forsideNavigasjonskort'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', tiles: 'tiles'},
    prepare({title, tiles}) {
      const count = Array.isArray(tiles) ? tiles.length : 0
      return {
        title: title || 'Gruppe navigasjonskort',
        subtitle: `${count} navigasjonskort`,
      }
    },
  },
})

export const bildeOgTekstPanelType = defineType({
  name: 'bildeOgTekstPanel',
  title: 'Bilde og tekst',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      description: 'Rik tekst med overskrifter, lister og lenker.',
      type: 'array',
      of: [articleTextBlock],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Bilde',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'imageSide',
      title: 'Plassering av bilde',
      type: 'string',
      options: {
        list: [
          {title: 'Venstre', value: 'left'},
          {title: 'Høyre', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
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
    defineField({
      name: 'color',
      title: 'Bakgrunnsfarge',
      type: 'string',
      options: {
        list: [
          {title: 'Burgunder', value: 'burgundy'},
          {title: 'Grønn (forest)', value: 'forest'},
          {title: 'Blå (denim)', value: 'denim'},
          {title: 'Oker', value: 'ochre'},
          {title: 'Hvit', value: 'white'},
        ],
        layout: 'dropdown',
      },
      initialValue: 'denim',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'heading', media: 'image', side: 'imageSide'},
    prepare({title, media, side}) {
      return {
        title: title || 'Bilde og tekst',
        subtitle: side === 'right' ? 'Bilde til høyre' : 'Bilde til venstre',
        media,
      }
    },
  },
})

export const forsideType = defineType({
  name: 'forside',
  title: 'Forside',
  type: 'document',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Hovedtittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hideTitle',
      title: 'Skjul hovedtittel visuelt',
      description: 'Skjuler hovedtittelen visuelt. Skjermlesere får tittelen nedenfor.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'screenReaderTitle',
      title: 'Tittel for skjermlesere',
      description: 'Leses opp av skjermlesere i stedet for hovedtittelen.',
      type: 'string',
      initialValue: 'Forside',
      hidden: ({parent}) => !(parent as {hideTitle?: boolean} | undefined)?.hideTitle,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {hideTitle?: boolean} | undefined
          return parent?.hideTitle && !value?.trim()
            ? 'Legg inn en tittel for skjermlesere når hovedtittelen er skjult.'
            : true
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Nettadresse',
      description: 'Lag en nettadresse fra hovedtittelen, eller skriv den inn selv.',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Innhold',
      description: 'Legg til og ordne innholdsblokker på forsiden.',
      type: 'array',
      of: [
        defineArrayMember({type: 'forsideNavigasjonsgruppe'}),
        defineArrayMember({type: 'informasjonPanel'}),
        defineArrayMember({type: 'bildeOgTekstPanel'}),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}) {
      return {
        title: title || 'Forside',
        subtitle: slug ? `/${slug}` : 'Forside',
      }
    },
  },
})
