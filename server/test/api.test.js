import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.js'

let server
let baseUrl

before(async () => {
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  baseUrl = `http://localhost:${server.address().port}`
})

after(() => server.close())

test('GET /api/health reports status', async () => {
  const res = await fetch(`${baseUrl}/api/health`)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).status, 'ok')
})

test('GET /api/nida/verify/:nin returns a known citizen', async () => {
  const res = await fetch(`${baseUrl}/api/nida/verify/19850412-11111-00001-21`)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).firstName, 'Amina')
})

test('GET /api/nida/verify/:nin returns 404 for an unknown NIN', async () => {
  const res = await fetch(`${baseUrl}/api/nida/verify/000`)
  assert.equal(res.status, 404)
})
