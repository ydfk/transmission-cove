import { readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { timingSafeEqual } from 'node:crypto'
import { releaseApi, releaseInfo, newerVersion, parseVersion } from '../shared/releases.mjs'

export function runUpdateScript(script, tag) {
  return new Promise((resolveRun, reject) => {
    const { COVE_UPDATE_TOKEN: _token, ...environment } = process.env
    // 固定的管理员脚本只接收已校验的版本参数，不拼接 shell 命令、不返回进程输出。
    execFile(script, [tag], { shell: false, windowsHide: true, timeout: 15 * 60 * 1000, maxBuffer: 1024 * 1024, env: environment }, error => error ? reject(new Error('更新脚本执行失败，请检查服务日志和安装目录')) : resolveRun())
  })
}

export function createUpdates({ root, script = '', token = '', fetcher = fetch, run = runUpdateScript, now = Date.now } = {}) {
  let cached, checkedAt = 0, checking
  let job = { state: 'idle' }
  const enabled = isAbsolute(script) && token.length >= 32
  async function currentVersion() {
    try {
      const manifest = JSON.parse(await readFile(resolve(root, 'cove-version.json'), 'utf8'))
      return manifest.updateProtocol === 1 && parseVersion(manifest.version) ? manifest.version : null
    } catch { return null }
  }
  async function latest() {
    if (cached && now() - checkedAt < 5 * 60 * 1000) return cached
    if (checking) return checking
    checking = (async () => {
      const response = await fetcher(releaseApi, { headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', signal: AbortSignal.timeout(12000) })
      if (!response.ok) throw new Error(response.status === 404 ? '暂无稳定发布版本' : '无法获取新版，请稍后重试')
      cached = releaseInfo(await response.json()); checkedAt = now(); return cached
    })().finally(() => { checking = undefined })
    return checking
  }
  async function capable() {
    if (!enabled || !await currentVersion()) return false
    try { await access(script, constants.X_OK); return true } catch { return false }
  }
  const json = (response, status, body) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(body))
  }
  function authorized(request) {
    const supplied = request.headers['x-cove-update-key']
    if (typeof supplied !== 'string') return false
    const a = Buffer.from(supplied), b = Buffer.from(token)
    return a.length === b.length && timingSafeEqual(a, b)
  }
  return async function handle(request, response, pathname) {
    if (!pathname.startsWith('/api/updates')) return false
    if (pathname === '/api/updates' && request.method === 'GET') {
      try { json(response, 200, { latest: await latest(), canInstall: await capable(), current: await currentVersion(), job }) }
      catch (error) { json(response, 502, { error: error.message }) }
      return true
    }
    if (pathname !== '/api/updates/install' || request.method !== 'POST') { json(response, 405, { error: '不支持的更新操作' }); return true }
    let sameOrigin = false
    try { sameOrigin = new URL(request.headers.origin).host === request.headers.host } catch { /* 缺失来源时拒绝。 */ }
    if (!sameOrigin || request.headers['sec-fetch-site'] === 'cross-site') { json(response, 403, { error: '拒绝跨站更新' }); return true }
    if (!enabled) { json(response, 409, { error: '当前部署未启用一键更新' }); return true }
    if (!authorized(request)) { json(response, 401, { error: '更新密钥不正确' }); return true }
    if (!request.headers['content-type']?.startsWith('application/json')) { json(response, 415, { error: '需要 JSON 请求' }); return true }
    if (job.state === 'running') { json(response, 409, { error: '正在更新，请勿重复操作' }); return true }
    // 从收到请求起占用锁，避免校验与查询期间同时启动两个更新。
    const previous = job
    job = { state: 'running' }
    try {
      const chunks = []; let size = 0
      for await (const chunk of request) { size += chunk.length; if (size > 1024) throw new Error('请求过大'); chunks.push(chunk) }
      const body = JSON.parse(Buffer.concat(chunks).toString())
      const release = await latest(), current = await currentVersion()
      if (body.tag !== release.tag || !release.installable || !current || !newerVersion(release.version, current)) throw new Error('没有可安装的新版，请重新检查版本')
      if (!await capable()) throw new Error('更新脚本不可用')
      job = { state: 'running', tag: release.tag }
      void Promise.resolve().then(() => run(script, release.tag)).then(async () => {
        if (await currentVersion() !== release.version) throw new Error('更新后版本校验失败，请检查更新脚本或备份')
        job = { state: 'succeeded', tag: release.tag }
      }).catch(() => { job = { state: 'failed', tag: release.tag, error: '更新未完成或版本校验失败，请检查安装目录与备份后重试' } })
      json(response, 202, job)
    } catch (error) { job = previous; json(response, 400, { error: error instanceof SyntaxError ? '请求格式无效' : error.message }) }
    return true
  }
}
