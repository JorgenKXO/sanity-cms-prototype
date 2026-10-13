import {visionTool} from '@sanity/vision'
import {defineConfig, type Template} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'
import {defaultDocumentNode, deskStructure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error(
    'Missing SANITY_STUDIO_PROJECT_ID. Copy .env.example to .env and set your Sanity project ID.',
  )
}

export default defineConfig({
  name: 'default',
  title: 'Skatteetaten.no innholdsportal',
  projectId,
  dataset,
  plugins: [
    structureTool({structure: deskStructure, defaultDocumentNode}),
    visionTool({defaultApiVersion: '2026-09-10'}),
  ],
  schema: {
    types: schemaTypes,
    // Gjør det mulig å opprette artikler/navigasjonssider med kategori forhåndsutfylt
    // når de opprettes fra en kategorimappe i strukturen.
    templates: (prev): Template[] => [
      ...prev,
      {
        id: 'article-with-kategori',
        title: 'Artikkel med kategori',
        schemaType: 'article',
        parameters: [{name: 'kategori', type: 'string'}],
        value: (params: {kategori?: string}) => ({kategori: params.kategori}),
      },
      {
        id: 'navigationPage-with-kategori',
        title: 'Navigasjonsside med kategori',
        schemaType: 'navigationPage',
        parameters: [{name: 'kategori', type: 'string'}],
        value: (params: {kategori?: string}) => ({kategori: params.kategori}),
      },
      {
        id: 'forside-ny',
        title: 'Forside',
        schemaType: 'forside',
        value: () => ({screenReaderTitle: 'Forside'}),
      },
    ],
  },
  document: {
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type === 'structure' && creationContext.schemaType === 'forside') {
        return prev.filter((option) => option.templateId === 'forside-ny')
      }

      return prev.filter(
        (option) =>
          option.templateId !== 'forside' && !option.templateId.startsWith('forside-'),
      )
    },
  },
  i18n: {
    locales: [{id: 'nb-NO', title: 'Norsk bokmål'}],
  },
})
