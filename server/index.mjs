import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lookup } from 'node:dns/promises'
import { remoteRpcTarget } from './remote-rpc.mjs'

const maxBody = 24 * 1024 * 1024
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }

export function validateServers(input) {
  if (!Array.isArray(input)) throw new Error('服务器配置必须是数组')
  if (input.length > 1) throw new Error('当前版本仅支持一个 Transmission 上游，请只保留当前服务器')
  const ids = new Set()
  return input.map(server => {
    if (!/^[a-zA-Z0-9_-]+$/.test(server.id) || ids.has(server.id) || typeof server.name !== 'string') throw new Error('服务器 ID 无效或重复')
    const url = new URL(server.url)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error('上游地址必须使用 HTTP/HTTPS，且不得包含凭据或锚点')
    ids.add(server.id)
    return { id: server.id, name: server.name, url: url.href }
  })
}
function sendJson(response, code, value) {
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(value))
}
async function bodyOf(request) {
  const chunks = []; let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBody) throw new Error('body_limit')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
export async function upstreamUrl(address, resolver = lookup) {
  const url = new URL(address)
  // Docker 的宿主机别名转为实际 IP，避免 daemon 将内部别名判为不受信任的 Host。
  // 仅处理预设别名；不修改认证、来源 IP 白名单或用户指定的其他主机名。
  if (url.hostname === 'host.docker.internal') {
    const result = await resolver(url.hostname, { family: 4 })
    url.hostname = result.address
  }
  return url.href
}
export function createApp({ servers = [], root = resolve('dist'), fetcher = fetch } = {}) {
  const configured = validateServers(servers)
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'same-origin')
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http: https:; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'")
    try {
      const url = new URL(request.url, 'http://localhost')
      if (url.pathname === '/api/server' && request.method === 'GET') {
        const server = configured[0]
        sendJson(response, 200, server ? { id: 'current', name: '当前 Transmission', url: '/api/rpc', address: server.url, managed: true, remoteProxy: '/api/remote-rpc' } : null); return
      }
      if (url.pathname === '/api/rpc' || url.pathname === '/api/remote-rpc') {
        const remote = url.pathname === '/api/remote-rpc'
        const server = configured[0]
        if (!remote && !server) { sendJson(response, 404, { error: '未知服务器' }); return }
        if (request.method !== 'POST') { sendJson(response, 405, { error: '仅允许 POST' }); return }
        const origin = request.headers.origin
        if ((remote && !origin) || request.headers['sec-fetch-site'] === 'cross-site' || (origin && new URL(origin).host !== request.headers.host)) { sendJson(response, 403, { error: '拒绝跨站请求' }); return }
        if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) { sendJson(response, 415, { error: '需要 application/json' }); return }
        if (Number(request.headers['content-length'] ?? 0) > maxBody) { sendJson(response, 413, { error: '请求过大' }); return }
        const body = await bodyOf(request)
        let payload
        try { payload = JSON.parse(body.toString('utf8')) } catch { sendJson(response, 400, { error: 'JSON 无效' }); return }
        let target = server?.url
        if (remote) {
          try { target = remoteRpcTarget(request.headers['x-cove-rpc-target'], payload) } catch (error) { sendJson(response, 400, { error: error.message }); return }
        }
        const headers = { 'Content-Type': 'application/json' }
        for (const name of ['authorization', 'x-transmission-session-id']) if (request.headers[name]) headers[name] = String(request.headers[name])
        const upstream = await fetcher(await upstreamUrl(target), { method: 'POST', headers, body, redirect: 'manual', signal: AbortSignal.timeout(20000) })
        if (upstream.status >= 300 && upstream.status < 400) { sendJson(response, 502, { error: '上游重定向被拒绝，请配置最终 RPC 地址' }); return }
        const responseHeaders = { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' }
        const sessionId = upstream.headers.get('x-transmission-session-id')
        if (sessionId) responseHeaders['X-Transmission-Session-Id'] = sessionId
        response.writeHead(upstream.status, responseHeaders)
        response.end(Buffer.from(await upstream.arrayBuffer()))
        return
      }
      if (url.pathname.startsWith('/api/')) { sendJson(response, 404, { error: '接口不存在' }); return }
      if (!['GET', 'HEAD'].includes(request.method)) { sendJson(response, 405, { error: '方法不允许' }); return }
      const pathname = decodeURIComponent(url.pathname)
      const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
      if (!path.startsWith(resolve(root) + sep)) { sendJson(response, 403, { error: '路径不允许' }); return }
      let fileStat
      try { fileStat = await stat(path) } catch { sendJson(response, 404, { error: '文件不存在' }); return }
      if (!fileStat.isFile()) { sendJson(response, 404, { error: '文件不存在' }); return }
      response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': extname(path) === '.html' ? 'no-cache' : 'public, max-age=86400' })
      response.end(request.method === 'HEAD' ? undefined : await readFile(path))
    } catch (error) {
      if (!response.headersSent) sendJson(response, error.message === 'body_limit' ? 413 : 502, { error: '请求处理失败，请检查上游连接或请求大小' })
      else response.end()
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const configPath = process.env.SERVERS_FILE ?? 'servers.local.json'
  let servers
  try { servers = process.env.TRANSMISSION_RPC_URL ? [{ id: 'current', name: '当前 Transmission', url: process.env.TRANSMISSION_RPC_URL }] : JSON.parse(await readFile(configPath, 'utf8')) } catch (error) {
    if (error.code === 'ENOENT') servers = [{ id: 'current', name: '当前 Transmission', url: process.env.DEFAULT_TRANSMISSION_RPC_URL ?? 'http://127.0.0.1:9091/transmission/rpc' }]
    else throw new Error('无法读取服务器配置，请检查 JSON 格式')
  }
  const app = createApp({ servers, root: resolve(process.env.STATIC_ROOT ?? 'dist') })
  app.listen(Number(process.env.PORT ?? 8080), process.env.HOST ?? '0.0.0.0', () => console.log(`Transmission Cove 已启动，端口 ${process.env.PORT ?? 8080}，已配置 ${servers.length} 个上游`))
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { app.close(); app.closeIdleConnections() })
}
