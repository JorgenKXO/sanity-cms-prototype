import {BookIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {SectionIconInput} from '../components/SectionIconInput'
import {sectionIconOptions} from '../components/SectionIcons'
import {informationPanelContentBlocks, warningPanelContentBlocks} from './articleContentBlocks'

// Delt lenke-annotasjon for portable text-feltene under.
const linkAnnotation = {
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

// Ren tekst, lenker og underoverskrifter (ingen dekoratorer eller lister).
const rettskilderTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Underoverskrift', value: 'h3'},
  ],
  lists: [],
  marks: {
    decorators: [],
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
  title: 'Regelverk',
  type: 'object',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
      description: 'Standardverdi er «Regelverk», men kan overskrives.',
      initialValue: 'Regelverk',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      description: 'Ren tekst, lenker, underoverskrifter og lenkelister.',
      type: 'array',
      of: [rettskilderTextBlock, defineArrayMember({type: 'lenkeliste'})],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Regelverk'}
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
      description: 'Valgfritt.',
      options: {list: sectionIconOptions.map(({title, value}) => ({title, value}))},
      components: {input: SectionIconInput},
    }),
    defineField({
      name: 'heading',
      title: 'Overskrift',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      description:
        'Normal tekst, underoverskrifter, uthevet tekst (fet/kursiv), lenker, lister, Åpne/Lukke, trekkspill-gruppe, knapp og lenkeliste.',
      type: 'array',
      of: informationPanelContentBlocks,
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
      name: 'body',
      title: 'Innhold',
      description:
        'Normal tekst, underoverskrifter, uthevet tekst (fet/kursiv), lenker, lister, Åpne/Lukke, knapp og lenkeliste.',
      type: 'array',
      of: warningPanelContentBlocks,
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Varselspanel'}
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
