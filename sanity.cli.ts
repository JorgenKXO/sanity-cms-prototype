import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error(
    'Missing SANITY_STUDIO_PROJECT_ID. Copy .env.example to .env and set your Sanity project ID.',
  )
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
})
