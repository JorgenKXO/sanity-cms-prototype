import {defineField, defineType} from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Nettstedsinnstillinger',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nettstedstittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Nettstedbeskrivelse',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'mainNavigation',
      title: 'Hovednavigasjon',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etikett',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'page',
              title: 'Side',
              type: 'reference',
              to: [{type: 'article'}, {type: 'navigationPage'}],
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'page.title',
            },
          },
        },
      ],
    }),
  ],
})
