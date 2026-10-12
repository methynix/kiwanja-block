import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSigningPayload, canonicalize, computeSignature, computeTransactionHash, hashRecord, sha256 } from '../src/utils/hash.js'
import { distanceMeters } from '../src/utils/geo.js'

const tx = {
  id: 'tx_00000000-0000-4000-8000-000000000000',
  plotId: 'plot_1',
  plotNumber: 'KK-014',
  ward: 'Kikuyu Kusini',
  priceTzs: 45000000,
  currency: 'TZS',
  seller: { nin: '19850412111110000121', fullName: 'Amina Juma Mrisho' },
  buyer: { nin: '19900723222220000215', fullName: 'Baraka Hassan Mollel' },
  leader: { userId: 'user_1' },
  createdAt: '2026-10-12T06:00:00.000Z',
}

test('sha256 computes hex digests', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('hashRecord is independent of key order', () => {
  assert.equal(hashRecord({ a: 1, b: { c: 2, d: 3 } }), hashRecord({ b: { d: 3, c: 2 }, a: 1 }))
})

test('canonicalize drops undefined keys like JSON does', () => {
  assert.equal(canonicalize({ b: 1, a: undefined }), '{"b":1}')
})

test('signature changes when any piece of evidence changes', () => {
  const payload = buildSigningPayload(tx)
  const evidence = { photoHash: 'a'.repeat(64), gps: { lat: -6.18, lng: 35.75 }, signedAt: '2026-10-12T06:01:00.000Z' }
  const base = computeSignature(payload, 'seller', tx.seller.nin, evidence)
  assert.notEqual(base, computeSignature(payload, 'seller', tx.seller.nin, { ...evidence, photoHash: 'b'.repeat(64) }))
  assert.notEqual(base, computeSignature(payload, 'seller', tx.seller.nin, { ...evidence, gps: null }))
  assert.notEqual(base, computeSignature(payload, 'buyer', tx.seller.nin, evidence))
  assert.notEqual(base, computeSignature({ ...payload, priceTzs: 1 }, 'seller', tx.seller.nin, evidence))
})

test('signature matches the value the browser computes for the same input', () => {
  const payload = buildSigningPayload(tx)
  const evidence = { photoHash: 'a'.repeat(64), gps: null, signedAt: '2026-10-12T06:01:00.000Z' }
  const expected = sha256(`${canonicalize(payload)}|seller|${tx.seller.nin}|{"gps":null,"photoHash":"${'a'.repeat(64)}","signedAt":"2026-10-12T06:01:00.000Z"}`)
  assert.equal(computeSignature(payload, 'seller', tx.seller.nin, evidence), expected)
})

test('transaction hash depends on all three signatures', () => {
  const payload = buildSigningPayload(tx)
  const sigs = { seller: '1'.repeat(64), buyer: '2'.repeat(64), leader: '3'.repeat(64) }
  assert.notEqual(computeTransactionHash(payload, sigs), computeTransactionHash(payload, { ...sigs, leader: '4'.repeat(64) }))
})

test('distanceMeters is accurate at Dodoma latitudes', () => {
  const d = distanceMeters({ lat: -6.1846, lng: 35.7581 }, { lat: -6.1855, lng: 35.7581 })
  assert.ok(d >= 99 && d <= 101, `expected about 100 m, got ${d}`)
})
