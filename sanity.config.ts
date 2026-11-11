import {visionTool} from '@sanity/vision'
import {defineConfig, type Template} from 'sanity'
import {structureTool} from 'sanity/structure'

import './studio.css'

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
    // Gjør det mulig å opprette artikler/seksjonssider med kategori forhåndsutfylt
    // når de opprettes fra en kategorimappe i strukturen.
    templates: (prev): Template[] => [
      ...prev,
      {
        id: 'sectionPage-with-kategori',
        title: 'Seksjonsside med kategori',
        schemaType: 'sectionPage',
        parameters: [{name: 'kategori', type: 'string'}],
        value: (params: {kategori?: string}) => ({kategori: params.kategori}),
      },
      {
        id: 'article-with-kategori',
        title: 'Artikkel med kategori',
        schemaType: 'article',
        parameters: [{name: 'kategori', type: 'string'}],
        value: (params: {kategori?: string}) => ({kategori: params.kategori}),
      },
    ],
  },
  document: {
    newDocumentOptions: (prev) =>
      prev.filter((option) =>
        ['article', 'article-with-kategori', 'sectionPage', 'sectionPage-with-kategori'].includes(
          option.templateId,
        ),
      ),
  },
  i18n: {
    locales: [{id: 'nb-NO', title: 'Norsk bokmål', weekInfo: {firstDay: 1, weekend: [6, 7], minimalDays: 4}}],
  },
})
