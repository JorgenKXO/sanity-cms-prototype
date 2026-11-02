import assert from 'node:assert/strict'
import {after, test} from 'node:test'
import {mkdtemp, rm} from 'node:fs/promises'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {build} from 'esbuild'
import {JSDOM} from 'jsdom'
import {act, createElement} from 'react'
import {createRoot} from 'react-dom/client'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = await mkdtemp(`${root}node_modules/.button-input-tests-`)
after(() => rm(directory, {recursive: true, force: true}))
await build({
  entryPoints: [`${root}components/ButtonDestinationInput.tsx`],
  outfile: `${directory}/input.mjs`,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  plugins: [{
    name: 'input-context',
    setup(builder) {
      builder.onResolve({filter: /^(sanity|@sanity\/ui)$/}, () => ({
        path: 'input-context', namespace: 'test',
      }))
      builder.onLoad({filter: /.*/, namespace: 'test'}, () => ({
        contents: `
          export const useClient = () => globalThis.buttonInputTest.client
          export const useToast = () => globalThis.buttonInputTest.toast
          export const set = (value, path) => ({type: 'set', value, path})
        `,
        loader: 'js',
      }))
    },
  }],
})
const {ButtonDestinationInput} = await import(pathToFileURL(`${directory}/input.mjs`).href)
const dom = new JSDOM('<div id="root"></div>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.IS_REACT_ACT_ENVIRONMENT = true
after(() => {
  dom.window.close()
  delete globalThis.window
  delete globalThis.document
  delete globalThis.IS_REACT_ACT_ENVIRONMENT
  delete globalThis.buttonInputTest
})

test('fills empty labels without overwriting text or applying stale requests', async () => {
  const pending = []
  const patches = []
  const notifications = []
  globalThis.buttonInputTest = {
    client: {
      withConfig(config) {
        assert.equal(config.perspective, 'drafts')
        return this
      },
      fetch(query, parameters) {
        return new Promise((resolve, reject) => pending.push({query, parameters, resolve, reject}))
      },
    },
    toast: {push: (notification) => notifications.push(notification)},
  }
  const reactRoot = createRoot(document.getElementById('root'))
  const render = async (value, readOnly = false) => act(async () => {
    reactRoot.render(createElement(ButtonDestinationInput, {
      value, readOnly,
      onChange: (patch) => patches.push(patch),
      renderDefault: () => createElement('div', null, 'Standard input'),
    }))
  })
  const destination = (id, label) => ({linkType: 'internal', page: {_ref: id}, label})
  try {
    await render(destination('drafts.page-a'))
    assert.deepEqual(pending[0].parameters, {id: 'page-a'})
    await act(async () => pending[0].resolve({title: 'Sidetittel A'}))
    assert.deepEqual(patches, [{type: 'set', path: ['label'], value: 'Sidetittel A'}])

    await render(destination('page-b', 'Egen tekst'))
    assert.equal(pending.length, 1)
    await render(destination('page-b', 'Sidetittel A'))
    assert.equal(pending.length, 1)

    await render(destination('page-c', ' '))
    await render(destination('page-d'))
    await act(async () => pending[1].resolve({title: 'Utdatert tittel'}))
    assert.equal(patches.length, 1)
    await render(destination('page-d', 'Skrevet mens henting pågår'))
    await act(async () => pending[2].resolve({title: 'Skal ikke overskrive'}))
    assert.equal(patches.length, 1)

    await render(destination('read-only'), true)
    await render({linkType: 'file'})
    assert.equal(pending.length, 3)

    await render(destination('missing'))
    await act(async () => pending[3].resolve(null))
    assert.equal(notifications.at(-1).status, 'warning')
    await render(destination('error'))
    await act(async () => pending[4].reject(new Error('Nettverksfeil')))
    assert.equal(notifications.at(-1).status, 'error')
    assert.equal(notifications.at(-1).description, 'Nettverksfeil')
    assert.equal(patches.length, 1)

    await render(destination('unmounted'))
    await act(async () => reactRoot.unmount())
    await act(async () => pending[5].resolve({title: 'For sent'}))
    assert.equal(patches.length, 1)
  } finally {
    await act(async () => reactRoot.unmount())
  }
})
