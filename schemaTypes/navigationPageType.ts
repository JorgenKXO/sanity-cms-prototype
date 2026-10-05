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
import {navigationTileFields} from './shared/navigationTileFields'

// Delt med informasjon/rettskilder-boksene: enkel lenke-annotasjon uten fri formatering.
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
  fields: navigationTileFields,
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
        'Kort innledende tekst som vises under tittelen. Lenker er tillatt, men ingen annen formatering (ingen fet/kursiv skrift, overskrifter eller lister).',
      type: 'array',
      of: [ingressBlock],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      description: 'Hvilken tematisk mappe siden hører til.',
      type: 'string',
      options: {
        list: [...kategoriOptions],
        layout: 'dropdown',
      },
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
      name: 'panels',
      title: 'Informasjons-, varsel- og krisebokser',
      description: 'Valgfritt. Vises over gruppene med navigasjonskort.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'informasjonPanel'}),
        defineArrayMember({type: 'varselPanel'}),
        defineArrayMember({type: 'krisePanel'}),
      ],
    }),
    defineField({
      name: 'tiles',
      title: 'Navigasjonskort og gruppeoverskrifter',
      description:
        'Legg til gruppeoverskrifter for å dele inn navigasjonskortene i seksjoner, og legg til ett eller flere navigasjonskort. Dra elementer for å styre rekkefølgen.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'navigationGroupHeading'}),
        defineArrayMember({type: 'navigationTilePage'}),
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
      name: 'listHeading',
      title: 'Navigasjonstittel',
      description:
        'Brukes i stedet for tittelen når denne siden vises som et navigasjonskort på en annen side. La stå tomt for å bruke tittelen.',
      type: 'string',
      group: 'navigationSeo',
    }),
    defineField({
      name: 'listIngress',
      title: 'Navigasjonsingress',
      description:
        'Brukes som en kort beskrivelse når denne siden vises som et navigasjonskort på en annen side. La stå tomt for ikke å vise noen ingress på kortet.',
      type: 'text',
      rows: 2,
      group: 'navigationSeo',
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
