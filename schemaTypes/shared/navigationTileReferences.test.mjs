import assert from 'node:assert/strict'
import {test} from 'node:test'
import {navigationTileReferences} from './navigationTileReferences.ts'

const card = (_key, ref) => ({
  _key,
  _type: 'navigationTilePage',
  page: {_type: 'reference', _ref: ref},
})

test('collects cards across groups and legacy content in order', () => {
  assert.deepEqual(navigationTileReferences([
    card('legacy', 'legacy-page'),
    {_type: 'navigationGroup', title: 'Heading', tiles: [card('a', 'page-a')]},
    {_type: 'informasjonPanel', page: {_ref: 'not-a-card'}},
    {_type: 'navigationGroup', tiles: [card('b', 'page-b'), card('c', 'page-a')]},
    {_type: 'navigationGroupHeading', title: 'Old heading'},
  ]), ['legacy-page', 'page-a', 'page-b', 'page-a'])
})

test('excludes only the current card, including inside a group', () => {
  const content = [
    {_type: 'navigationGroup', _key: 'group', tiles: [card('current', 'same-page')]},
    {_type: 'navigationGroup', tiles: [card('another', 'same-page')]},
    card('legacy', 'legacy-page'),
  ]
  assert.deepEqual(navigationTileReferences(content, 'current'), ['same-page', 'legacy-page'])
  assert.deepEqual(navigationTileReferences(content, 'legacy'), ['same-page', 'same-page'])
})

test('accepts incomplete editor content without collecting unrelated references', () => {
  for (const content of [undefined, null, {}, []]) {
    assert.deepEqual(navigationTileReferences(content), [])
  }
  assert.deepEqual(navigationTileReferences([
    null,
    {_type: 'navigationGroup'},
    {_type: 'navigationGroup', tiles: [null, {_type: 'navigationTilePage'}]},
    {_type: 'navigationTilePage', page: {_ref: 42}},
    {_type: 'navigationTilePage', page: null},
    card(undefined, 'unkeyed-page'),
  ]), ['unkeyed-page'])
})
