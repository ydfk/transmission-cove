import { afterEach, expect, it, vi } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.mjs'

const cleanups = []
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup() })
const token = 'fixture-update-key-at-least-32-characters'
const release = { tag_name: 'v0.2.0', assets: [{ name: 'transmission-cove-0.2.0-web.tar.gz' }, { name: 'SHA256SUMS' }] }
async function fixture(options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'cove-updates-'))
  cleanups.push(() => rm(root, { recursive: true, force: true }))
  const manifest = version => writeFile(join(root, 'cove-version.json'), JSON.stringify({ version, updateProtocol: 1 }))
  await manifest('0.1.0')
  const script = join(root, 'update.sh'); await writeFile(script, '#!/bin/sh\nexit 0\n', { mode: 0o700 })
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(release)))
  const run = options.run ?? vi.fn(async () => { await manifest('0.2.0') })
  const app = createApp({ root, updates: { script, token, fetcher, run, ...options } })
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
  cleanups.push(() => new Promise(resolve => { app.closeAllConnections(); app.close(resolve) }))
  const base = `http://127.0.0.1:${app.address().port}`
  const get = () => fetch(`${base}/api/updates`).then(response => response.json())
  const post = (body = { tag: 'v0.2.0' }, headers = {}) => fetch(`${base}/api/updates/install`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, 'X-Cove-Update-Key': token, ...headers }, body: JSON.stringify(body) })
  return { get, post, run, fetcher, manifest }
}
it('查询缓存发布信息，默认不开启更新且不泄露密钥或脚本路径', async () => {
  const { get, post, fetcher } = await fixture({ script: '', token: '' })
  expect(await get()).toMatchObject({ canInstall: false, current: '0.1.0', latest: { version: '0.2.0' } })
  expect(JSON.stringify(await get())).not.toContain(token)
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(fetcher.mock.calls[0][1].credentials).toBe('omit')
  expect((await post()).status).toBe(409)
})
it('拒绝跨站、缺失认证、伪造 Tag 和过大请求，不运行脚本', async () => {
  const { post, run } = await fixture()
  expect((await post({}, { Origin: 'https://other.example' })).status).toBe(403)
  expect((await post({}, { Origin: '' })).status).toBe(403)
  expect((await post({}, { 'X-Cove-Update-Key': '' })).status).toBe(401)
  expect((await post({ tag: 'v0.2.0;echo unsafe' })).status).toBe(400)
  expect((await post({ tag: 'v0.2.0', padding: 'a'.repeat(1200) })).status).toBe(400)
  expect(run).not.toHaveBeenCalled()
})
it('成功更新必须核实安装版本，重复执行不能降级或重装', async () => {
  const { get, post, run } = await fixture()
  expect((await get()).canInstall).toBe(true)
  expect((await post()).status).toBe(202)
  await vi.waitFor(async () => expect((await get()).job.state).toBe('succeeded'))
  expect((await get()).current).toBe('0.2.0')
  expect(run.mock.calls[0][1]).toBe('v0.2.0')
  expect((await post()).status).toBe(400)
  expect(run).toHaveBeenCalledTimes(1)
})
it('更新期间重复请求被拒绝，退出成功但版本未变化也不报成功', async () => {
  let finish
  const run = vi.fn(() => new Promise(resolve => { finish = resolve }))
  const { get, post } = await fixture({ run })
  expect((await post()).status).toBe(202)
  expect((await post()).status).toBe(409)
  finish()
  await vi.waitFor(async () => expect((await get()).job.state).toBe('failed'))
  expect(run).toHaveBeenCalledTimes(1)
})
it('下载检查失败或更新脚本失败时不报告成功，不向页面输出脚本错误内容', async () => {
  const { get, post } = await fixture({ run: async () => { throw new Error('sensitive local path') } })
  expect((await post()).status).toBe(202)
  await vi.waitFor(async () => expect((await get()).job.state).toBe('failed'))
  expect(JSON.stringify(await get())).not.toContain('sensitive')
  const unavailable = await fixture({ fetcher: async () => new Response('', { status: 503 }) })
  expect(await unavailable.get()).toMatchObject({ error: '无法获取新版，请稍后重试' })
  expect((await unavailable.post()).status).toBe(400)
  expect(unavailable.run).not.toHaveBeenCalled()
})
