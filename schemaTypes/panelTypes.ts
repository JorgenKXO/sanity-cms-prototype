import {BookIcon, ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Delt lenke-annotasjon for portable text-feltene under.
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

// Ren tekst, lenker og underoverskrifter (ingen fet/kursiv skrift).
const rettskilderTextBlock = defineArrayMember({
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

// Ren tekst, uthevet tekst (fet/kursiv), lenker og underoverskrifter.
const informasjonTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Underoverskrift', value: 'h3'},
  ],
  lists: [],
  marks: {
    decorators: [
      {title: 'Fet', value: 'strong'},
      {title: 'Kursiv', value: 'em'},
    ],
    annotations: [linkAnnotation],
  },
})

export const rettskilderPanelType = defineType({
  name: 'rettskilderPanel',
  title: 'Rettskilder',
  type: 'object',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      description: 'Standardverdi er «Rettskilder», men kan overskrives.',
      initialValue: 'Rettskilder',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      description: 'Ren tekst, lenker og underoverskrifter.',
      type: 'array',
      of: [rettskilderTextBlock],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Rettskilder'}
    },
  },
})

export const informasjonPanelType = defineType({
  name: 'informasjonPanel',
  title: 'Informasjon',
  type: 'object',
  icon: InfoOutlineIcon,
  fields: [
    defineField({
      name: 'color',
      title: 'Bakgrunnsfarge',
      type: 'string',
      options: {
        list: [
          {title: 'Blå bakgrunn (denim/10)', value: 'denim'},
          {title: 'Grønn bakgrunn (forest/10)', value: 'forest'},
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
      description: 'Valgfritt. Velg et ikon fra Skatteetatens designsystem som skal vises ved siden av overskriften.',
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
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      type: 'array',
      of: [informasjonTextBlock],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Informasjon'}
    },
  },
})

export const varselPanelType = defineType({
  name: 'varselPanel',
  title: 'Varsel',
  type: 'object',
  icon: ErrorOutlineIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      type: 'array',
      of: [informasjonTextBlock],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Varsel'}
    },
  },
})

export const krisePanelType = defineType({
  name: 'krisePanel',
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
      name: 'body',
      title: 'Innhold',
      type: 'array',
      of: [informasjonTextBlock],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Krise'}
    },
  },
})
