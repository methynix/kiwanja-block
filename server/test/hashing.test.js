import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hashObject, sha256 } from '../src/lib/hashing.js'

test('sha256 computes hex digests', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('hashObject is independent of key order', () => {
  assert.equal(hashObject({ a: 1, b: { c: 2, d: 3 } }), hashObject({ b: { d: 3, c: 2 }, a: 1 }))
})
