import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Artikkel',
  type: 'document',
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
      description: 'Kort innledende avsnitt som vises under tittelen.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: 'breadcrumbs',
      title: 'Brødsmulesti',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etikett',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Nettadresse',
              type: 'string',
              validation: (rule) =>
                rule.uri({
                  allowRelative: true,
                  scheme: ['http', 'https', 'mailto', 'tel'],
                }),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'href'},
          },
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Brødtekst',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Overskrift 2', value: 'h2'},
            {title: 'Overskrift 3', value: 'h3'},
          ],
          lists: [
            {title: 'Punktliste', value: 'bullet'},
            {title: 'Nummerert liste', value: 'number'},
          ],
          marks: {
            annotations: [
              {
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
              },
            ],
          },
        }),
        defineArrayMember({
          name: 'infoBox',
          title: 'Infoboks',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Tittel',
              type: 'string',
            }),
            defineField({
              name: 'text',
              title: 'Tekst',
              type: 'text',
              rows: 4,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'text'},
            prepare({title, subtitle}) {
              return {
                title: title || 'Infoboks',
                subtitle,
              }
            },
          },
        }),
        defineArrayMember({
          name: 'relatedLink',
          title: 'Relatert lenke',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etikett',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
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
          preview: {
            select: {title: 'label', subtitle: 'href'},
          },
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Sist oppdatert',
      type: 'date',
    }),
  ],
  initialValue: () => ({
    title: 'Når gjelder unntak fra en avgift?',
    slug: {_type: 'slug', current: 'nar-gjelder-unntak-fra-en-avgift'},
    ingress:
      'I enkelte situasjoner gjelder egne regler. Denne prototypen viser hvordan en enkel veiledningsartikkel kan bygges opp.',
    breadcrumbs: [
      {_key: 'home', label: 'Forside', href: '/'},
      {_key: 'topic', label: 'Temaområde', href: '/tema/'},
      {_key: 'article', label: 'Veiledning', href: '/tema/veiledning/'},
    ],
    body: [
      {
        _key: 'intro',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: 'intro-span',
            _type: 'span',
            marks: [],
            text: 'Eksemplene under er skrevet som nøytralt innhold, slik at du kan teste struktur og visning uten å kopiere originalteksten.',
          },
        ],
      },
      {
        _key: 'section-one',
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [
          {
            _key: 'section-one-span',
            _type: 'span',
            marks: [],
            text: 'Første seksjon',
          },
        ],
      },
      {
        _key: 'section-one-text',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: 'section-one-text-span',
            _type: 'span',
            marks: [],
            text: 'Bruk korte avsnitt, tydelige mellomtitler og lenker der leseren trenger mer detaljert informasjon.',
          },
        ],
      },
      {
        _key: 'related-one',
        _type: 'relatedLink',
        label: 'Les mer om et relatert tema',
        href: '/tema/relatert/',
      },
      {
        _key: 'section-two',
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [
          {
            _key: 'section-two-span',
            _type: 'span',
            marks: [],
            text: 'Andre seksjon',
          },
        ],
      },
      {
        _key: 'section-two-text',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: 'section-two-text-span',
            _type: 'span',
            marks: [],
            text: 'Legg inn flere seksjoner når innholdet dekker ulike unntak, vilkår eller situasjoner.',
          },
        ],
      },
      {
        _key: 'info-one',
        _type: 'infoBox',
        title: 'Husk',
        text: 'Denne boksen kan brukes til viktige presiseringer eller korte forklaringer.',
      },
    ],
    updatedAt: new Date().toISOString().slice(0, 10),
  }),
  preview: {
    select: {
      title: 'title',
      subtitle: 'ingress',
    },
  },
})
