import {PresentationIcon} from '@sanity/icons'
import {defineField} from 'sanity'

export const highlightedIntroGroup = () => ({
  name: 'hero',
  title: 'Fremhevet intro',
  icon: PresentationIcon,
})

export const highlightedIntroFields = () => [
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
]
