import {LinkIcon, ThLargeIcon, TiersIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

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
    annotations: [linkAnnotation],
  },
})

export const navigasjonKategorier = [
  {title: 'Aksjer og verdipapirer', value: 'aksjer-og-verdipapirer'},
  {title: 'Aksjonærregisteroppgaven', value: 'aksjonaerregisteroppgaven'},
  {title: 'A-meldingen', value: 'a-meldingen'},
  {title: 'Arbeid', value: 'arbeid'},
  {title: 'Arbeidsgiver', value: 'arbeidsgiver'},
  {title: 'Arv og gave', value: 'arv-og-gave'},
  {title: 'Bank og lån', value: 'bank-og-lan'},
  {title: 'Bil og kjøretøy (skatt)', value: 'bil-og-kjoretoy-skatt'},
  {title: 'Bilavgift', value: 'bilavgift'},
  {title: 'Bolig og eiendom', value: 'bolig-og-eiendom'},
  {title: 'Deling', value: 'deling'},
  {title: 'Familie og helse', value: 'familie-og-helse'},
  {title: 'Finnmark og svalbard', value: 'finnmark-og-svalbard'},
  {title: 'Folkeregister', value: 'folkeregister'},
  {title: 'Hobby eller næring', value: 'hobby-eller-naering'},
  {title: 'Innkreving og betaling', value: 'innkreving-og-betaling'},
  {title: 'Internprising', value: 'internprising'},
  {title: 'Kalender (datoer og frister)', value: 'kalender-datoer-og-frister'},
  {title: 'Merverdiavgift', value: 'merverdiavgift'},
  {title: 'Offentlig støtte', value: 'offentlig-stotte'},
  {title: 'Samisk', value: 'samisk'},
  {title: 'Skatt næring', value: 'skatt-naering'},
  {title: 'Skattekort og forskudd', value: 'skattekort-og-forskudd'},
  {title: 'Skattemelding person', value: 'skattemelding-person'},
  {title: 'Skatteoppgjør', value: 'skatteoppgjor'},
  {title: 'Særavgift', value: 'saeravgift'},
  {title: 'Tredjepartsopplysninger', value: 'tredjepartsopplysninger'},
  {title: 'Trygd og pensjon', value: 'trygd-og-pensjon'},
] as const

export const navigationGroupHeadingType = defineType({
  name: 'navigationGroupHeading',
  title: 'Gruppeoverskrift',
  type: 'object',
  icon: TiersIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Gruppeoverskrift',
      description: 'Vises som overskrift over flisene som følger under denne.',
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
  title: 'Sideflis',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'page',
      title: 'Side',
      type: 'reference',
      to: [{type: 'article'}, {type: 'navigationPage'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titleOverride',
      title: 'Overstyr tittel',
      description:
        'Valgfritt. Vises i stedet for den lenkede sidens tittel/listeoverskrift, kun i denne flislisten. La stå tomt for å bruke den lenkede sidens listeoverskrift (eller tittelen, hvis den ikke har noen listeoverskrift).',
      type: 'string',
    }),
    defineField({
      name: 'ingressOverride',
      title: 'Overstyr ingress',
      description:
        'Valgfritt. Vises i stedet for den lenkede sidens listeingress, kun i denne flislisten. La stå tomt for å bruke den lenkede sidens listeingress (eller ingen ingress i det hele tatt, hvis den ikke har noen).',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {title: 'titleOverride', pageTitle: 'page.title'},
    prepare({title, pageTitle}) {
      return {title: title || pageTitle || 'Sideflis', subtitle: 'Sideflis'}
    },
  },
})

export const navigationPageType = defineType({
  name: 'navigationPage',
  title: 'Navigasjonsside',
  type: 'document',
  icon: ThLargeIcon,
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
        list: [...navigasjonKategorier],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'heroEnabled',
      title: 'Fremhevet intro',
      description:
        'Gir mulighet for bakgrunnsfarge og bruk av bilde. Brukes for alle sider som er tydelige landingssider eller startpunkt for et tema',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'heroBackgroundColor',
      title: 'Bakgrunnsfarge',
      type: 'string',
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
      options: {hotspot: true},
      hidden: ({parent}) => !(parent as {heroEnabled?: boolean} | undefined)?.heroEnabled,
    }),
    defineField({
      name: 'panels',
      title: 'Rettskilder- og informasjonsbokser',
      description: 'Valgfritt. Vises over gruppene med navigasjonsfliser. Varsel- og krise-bokser kan ikke brukes på navigasjonssider.',
      type: 'array',
      of: [
        defineArrayMember({type: 'navigationPanel'}),
        defineArrayMember({type: 'rettskilderPanel'}),
        defineArrayMember({type: 'informasjonPanel'}),
      ],
    }),
    defineField({
      name: 'tiles',
      title: 'Fliser og gruppeoverskrifter',
      description:
        'Legg til gruppeoverskrifter for å dele inn flisene i seksjoner, og legg til én eller flere sidefliser. Dra elementer for å styre rekkefølgen.',
      type: 'array',
      of: [
        defineArrayMember({type: 'navigationGroupHeading'}),
        defineArrayMember({type: 'navigationTilePage'}),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'listHeading',
      title: 'Listeoverskrift',
      description:
        'Brukes i stedet for tittelen når denne siden vises som en navigasjonsflis på en annen side. La stå tomt for å bruke tittelen.',
      type: 'string',
    }),
    defineField({
      name: 'listIngress',
      title: 'Listeingress',
      description:
        'Brukes som en kort beskrivelse når denne siden vises som en navigasjonsflis på en annen side. La stå tomt for ikke å vise noen ingress på flisen.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO-tittel',
      type: 'string',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO-beskrivelse',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'kategori'},
  },
})
