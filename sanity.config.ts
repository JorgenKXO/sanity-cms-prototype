import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
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
  },
  i18n: {
    locales: [{id: 'nb-NO', title: 'Norsk bokmål'}],
  },
})
