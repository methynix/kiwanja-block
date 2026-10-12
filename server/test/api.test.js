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

test('GET /api/health reports status with no-store caching', async () => {
  const res = await fetch(`${baseUrl}/api/health`)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('cache-control'), 'no-store')
  assert.equal((await res.json()).status, 'ok')
})

test('protected routes require a bearer token', async () => {
  for (const path of ['/api/nida/lookup/19850412111110000121', '/api/plots', '/api/transactions']) {
    const res = await fetch(`${baseUrl}${path}`)
    assert.equal(res.status, 401, path)
  }
})

test('login without the anti-CSRF header is blocked', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: '+255700000002', password: 'x' }),
  })
  assert.equal(res.status, 403)
})

test('refresh without a session cookie answers 204', async () => {
  const res = await fetch(`${baseUrl}/api/auth/refresh`, { method: 'POST', headers: { 'x-requested-with': 'kiwanja' } })
  assert.equal(res.status, 204)
})

test('oversized bodies are refused on small routes', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'kiwanja' },
    body: JSON.stringify({ phone: 'x'.repeat(20000), password: 'x' }),
  })
  assert.equal(res.status, 413)
})

test('public verification validates the hash parameter', async () => {
  const res = await fetch(`${baseUrl}/api/plots/plot_x/verify?h=not-a-hash`)
  assert.equal(res.status, 400)
})

test('unknown routes return 404 without leaking details', async () => {
  const res = await fetch(`${baseUrl}/api/nope`)
  assert.equal(res.status, 404)
  assert.deepEqual(await res.json(), { error: 'Route not found' })
})
