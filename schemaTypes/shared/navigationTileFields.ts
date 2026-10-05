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
    description:
      'Valgfritt. Vises i stedet for tittelen på den lenkede siden, kun på dette kortet. Navigasjonstittel på artikkel- og navigasjonssider fjernes. La stå tomt for å bruke sidens tittel.',
    type: 'string',
  }),
  defineField({
    name: 'ingressOverride',
    title: 'Ingress på kortet',
    description:
      'Valgfritt. Kort tekst som vises på dette kortet. Navigasjonsingress på artikkel- og navigasjonssider fjernes. La stå tomt for å vise kortet uten ingress.',
    type: 'text',
    rows: 2,
  }),
]
