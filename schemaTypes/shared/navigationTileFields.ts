import {defineField} from 'sanity'

export const navigationTileFields = [
  defineField({
    name: 'page',
    title: 'Side',
    type: 'reference',
    to: [{type: 'article'}, {type: 'navigationPage'}],
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: 'titleOverride',
    title: 'Overstyr navigasjonstittel',
    description:
      'Valgfritt. Vises i stedet for den lenkede sidens navigasjonstittel, kun i denne kortlisten. La stå tomt for å bruke den lenkede sidens navigasjonstittel (eller tittelen, hvis den ikke har noen).',
    type: 'string',
  }),
  defineField({
    name: 'ingressOverride',
    title: 'Overstyr navigasjonsingress',
    description:
      'Valgfritt. Vises i stedet for den lenkede sidens navigasjonsingress, kun i denne kortlisten. La stå tomt for å bruke den lenkede sidens navigasjonsingress (eller ingen ingress i det hele tatt, hvis den ikke har noen).',
    type: 'text',
    rows: 2,
  }),
]
