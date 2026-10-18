import { legacyParams, normalize } from './protocol'
import type { Credentials, RpcClient, RpcValues, Server } from './types'

export class RpcError extends Error {
  constructor(message: string, public status?: number) { super(message); this.name = 'RpcError' }
}

export function validateEndpoint(input: string): string {
  const value = input.trim()
  if (!value || value.startsWith('//')) throw new Error('请输入 RPC 地址或以 / 开头的代理路径')
  const url = new URL(value, 'http://localhost')
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error('地址必须使用 HTTP/HTTPS，且不能包含密码或锚点')
  if (!value.startsWith('/') && !/^https?:\/\//i.test(value)) throw new Error('完整地址需要包含 http:// 或 https://')
  return value
}

export class TransmissionClient implements RpcClient {
  modern = false
  private sessionId = ''
  private sequence = 0
  constructor(private server: Server, private credentials?: Credentials, private fetcher: typeof fetch = fetch) {}

  async connect(signal?: AbortSignal): Promise<RpcValues> {
    const session = await this.call<RpcValues>('session_get', {}, signal)
    const major = Number(String(session.version ?? '').split('.')[0])
    if (major < 4) throw new RpcError('需要 Transmission 4.0 或更新版本')
    this.modern = Number(String(session.rpc_version_semver ?? '0').split('.')[0]) >= 6
    return session
  }

  async call<T = RpcValues>(method: string, params: RpcValues = {}, signal?: AbortSignal): Promise<T> {
    // Transmission 的空 ids 表示全部任务；所有任务变更必须显式指定目标。
    if ((method.startsWith('torrent_') && !['torrent_get', 'torrent_add'].includes(method)) || method.startsWith('queue_')) {
      if (!Array.isArray(params.ids) || !params.ids.length) throw new RpcError('请先选择要操作的任务')
    }
    const requestId = ++this.sequence
    const modern = this.modern
    const body = JSON.stringify(modern
      ? { jsonrpc: '2.0', id: requestId, method, params }
      : { method: method.replaceAll('_', '-'), arguments: legacyParams(method, params), tag: requestId })
    for (let attempt = 0; attempt < 2; attempt++) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (this.sessionId) headers['X-Transmission-Session-Id'] = this.sessionId
      if (this.credentials?.username) {
        const bytes = new TextEncoder().encode(`${this.credentials.username}:${this.credentials.password}`)
        headers.Authorization = `Basic ${btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))}`
      }
      let response: Response
      try {
        const fetcher = this.fetcher
        response = await fetcher(this.server.url, { method: 'POST', headers, body, credentials: 'same-origin', cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) })
      } catch (error) {
        if (signal?.aborted) throw error
        throw new RpcError('连接失败或超时，请检查 RPC 地址、代理与网络；操作结果未知时请先刷新再重试')
      }
      if (response.status === 409 && attempt === 0) {
        const token = response.headers.get('X-Transmission-Session-Id')
        if (!token) throw new RpcError('无法读取会话标识，请通过同源代理连接', 409)
        this.sessionId = token
        continue
      }
      if (response.status === 401) throw new RpcError('认证失败，请检查用户名和密码', 401)
      if (response.status === 403) throw new RpcError('访问被拒绝，请检查 RPC 白名单和代理配置', 403)
      if (!response.ok) throw new RpcError(`RPC 请求失败（HTTP ${response.status}）`, response.status)
      let payload
      try { payload = await response.json() } catch { throw new RpcError('服务器未返回 JSON，请检查是否填写了正确的 RPC 路径') }
      if (modern) {
        if (payload.error) throw new RpcError(payload.error.message || 'RPC 操作失败')
        return normalize(payload.result) as T
      }
      if (payload.result !== 'success') throw new RpcError(String(payload.result || 'RPC 响应格式无效'))
      return normalize(payload.arguments) as T
    }
    throw new RpcError('会话验证失败，请重新连接')
  }
}
