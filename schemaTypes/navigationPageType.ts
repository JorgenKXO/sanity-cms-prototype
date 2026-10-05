import {
  BlockContentIcon,
  DocumentIcon,
  EarthGlobeIcon,
  MasterDetailIcon,
  PresentationIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'

import {kategoriOptions} from './kategoriOptions'
import {NavigationTilesArrayFunctions} from '../components/NavigationTilesArrayFunctions'
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
      description: 'Vises som overskrift over navigasjonskortene som følger under denne.',
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
      description:
        'Kort innledende tekst som vises under tittelen. Kun ren tekst, uten lenker eller formatering.',
      type: 'array',
      of: [ingressBlock],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroEnabled',
      title: 'Fremhevet intro',
      description:
        'Gir mulighet for bakgrunnsfarge og bruk av bilde. Brukes for alle sider som er tydelige landingssider eller startpunkt for et tema',
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
      description:
        'Vises til høyre for tittel og ingress i den fremhevede introen. Bildet blir vist som dekorativt (med tom alt-tekst) for skjermlesere.',
      type: 'image',
      group: 'hero',
      options: {hotspot: true},
      hidden: ({parent}) => !(parent as {heroEnabled?: boolean} | undefined)?.heroEnabled,
    }),
    defineField({
      name: 'tiles',
      title: 'Hovedinnhold',
      description:
        'Legg til navigasjonskort, gruppeoverskrifter, informasjon, varsel og krise. Dra elementene for å velge rekkefølgen. Bokser vises i full bredde mellom gruppene med kort.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'navigationGroupHeading'}),
        defineArrayMember({type: 'navigationTilePage'}),
        defineArrayMember({type: 'informasjonPanel'}),
        defineArrayMember({type: 'varselPanel'}),
        defineArrayMember({type: 'krisePanel'}),
      ],
      components: {
        input: (inputProps: ArrayOfObjectsInputProps) =>
          inputProps.renderDefault({
            ...inputProps,
            arrayFunctions: NavigationTilesArrayFunctions,
          }),
      },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      description: 'Hvilken tematisk mappe siden hører til.',
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
