import {
  BlockContentIcon,
  DocumentIcon,
  EarthGlobeIcon,
  MasterDetailIcon,
  PresentationIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {kategoriOptions} from './kategoriOptions'
import {NavigationContentInput} from '../components/NavigationContentInput'
import {NavigationTileReferenceInput} from '../components/NavigationTileReferenceInput'
import {navigationTileFields} from './shared/navigationTileFields'

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

// Beholdt for bakoverkompatibilitet: structure.ts importerte tidligere kategoriene herfra.
export {kategoriOptions as navigasjonKategorier} from './kategoriOptions'

export const navigationGroupHeadingType = defineType({
  name: 'navigationGroupHeading',
  title: 'Gruppeoverskrift',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Gruppeoverskrift',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Gruppeoverskrift'}
    },
  },
})

export const navigationTilePageType = defineType({
  name: 'navigationTilePage',
  title: 'Navigasjonskort',
  type: 'object',
  icon: DocumentIcon,
  fields: navigationTileFields.map((field) =>
    field.name === 'page'
      ? {...field, components: {input: NavigationTileReferenceInput}}
      : field,
  ),
  preview: {
    select: {title: 'titleOverride', pageTitle: 'page.title', pageType: 'page._type'},
    prepare({title, pageTitle, pageType}) {
      return {
        title: title || pageTitle || 'Navigasjonskort',
        subtitle: 'Navigasjonskort',
        media: pageType === 'navigationPage' ? MasterDetailIcon : DocumentIcon,
      }
    },
  },
})

export const navigationGroupType = defineType({
  name: 'navigationGroup',
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
      of: [defineArrayMember({type: 'navigationTilePage'})],
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

export const navigationPageType = defineType({
  name: 'navigationPage',
  title: 'Navigasjonsside',
  type: 'document',
  icon: MasterDetailIcon,
  groups: [
    {name: 'hero', title: 'Fremhevet intro', icon: PresentationIcon},
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
      type: 'array',
      of: [ingressBlock],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroEnabled',
      title: 'Fremhevet intro',
      description: 'Intro med bakgrunnsfarge og valgfritt bilde.',
      type: 'boolean',
      group: 'hero',
      initialValue: false,
    }),
    defineField({
      name: 'heroBackgroundColor',
      title: 'Bakgrunnsfarge',
      type: 'string',
      group: 'hero',
      options: {
        list: [
          {title: 'Blå', value: 'blue'},
          {title: 'Grønn', value: 'green'},
          {title: 'Gul', value: 'yellow'},
          {title: 'Hvit', value: 'white'},
        ],
        layout: 'dropdown',
      },
      initialValue: 'white',
      hidden: ({parent}) => !(parent as {heroEnabled?: boolean} | undefined)?.heroEnabled,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {heroEnabled?: boolean} | undefined
          if (parent?.heroEnabled && !value) {
            return 'Velg en bakgrunnsfarge når fremhevet intro er aktivert.'
          }
          return true
        }),
    }),
    defineField({
      name: 'heroImage',
      title: 'Bilde/illustrasjon',
      description: 'Dekorativt bilde, skjult for skjermlesere.',
      type: 'image',
      group: 'hero',
      options: {hotspot: true},
      hidden: ({parent}) => !(parent as {heroEnabled?: boolean} | undefined)?.heroEnabled,
    }),
    defineField({
      name: 'tiles',
      title: 'Hovedinnhold',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'navigationGroup'}),
        defineArrayMember({
          type: 'navigationGroupHeading',
          deprecated: {reason: 'Bruk Gruppe navigasjonskort.'},
        }),
        defineArrayMember({
          type: 'navigationTilePage',
          deprecated: {reason: 'Legg kortet i en Gruppe navigasjonskort.'},
        }),
        defineArrayMember({type: 'informasjonPanel'}),
        defineArrayMember({type: 'varselPanel'}),
        defineArrayMember({type: 'krisePanel'}),
      ],
      components: {
        input: NavigationContentInput,
      },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      type: 'string',
      group: 'navigationSeo',
      options: {
        list: [...kategoriOptions],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO-tittel',
      type: 'string',
      group: 'navigationSeo',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO-beskrivelse',
      type: 'text',
      rows: 3,
      group: 'navigationSeo',
      validation: (rule) => rule.max(160),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'kategori'},
  },
})
