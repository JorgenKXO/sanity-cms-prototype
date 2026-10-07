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
    title: 'Overstyr tittel på kortet',
    description: 'Tomt felt bruker sidens tittel.',
    type: 'string',
  }),
  defineField({
    name: 'ingressOverride',
    title: 'Ingress på kortet',
    description: 'Valgfritt. Vises kun på dette kortet.',
    type: 'text',
    rows: 2,
  }),
]
