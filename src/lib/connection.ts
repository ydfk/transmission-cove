import type { Server } from './types'
import { validateEndpoint } from './rpc'

export function manualServer(value: unknown): Server | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try { return { id: 'manual', name: '手动连接', url: validateEndpoint(value) } } catch { return null }
}

export function connectionTarget(endpoint: string, automatic: Server): Server {
  const value = validateEndpoint(endpoint)
  if (automatic.managed && automatic.address && (value === automatic.url || value === automatic.address)) return automatic
  if (automatic.remoteProxy === '/api/remote-rpc' && /^https?:\/\//i.test(value)) {
    return { id: 'manual', name: '手动连接', url: automatic.remoteProxy, address: value, remoteTarget: value }
  }
  return { id: 'manual', name: '手动连接', url: value }
}

export function nativeServer(pathname: string): Server {
  const web = pathname.match(/^(.*\/)web(?:\/|$)/)
  return { id: 'local', name: '当前 Transmission', url: web ? `${web[1]}rpc` : '/transmission/rpc' }
}

export async function discoverServer(pathname: string, fetcher: typeof fetch, signal?: AbortSignal): Promise<Server> {
  const native = nativeServer(pathname)
  // daemon 的 Web 路径本身已确定 RPC 前缀，不向原生服务请求独立部署接口。
  if (/\/web(?:\/|$)/.test(pathname)) return native
  try {
    const response = await fetcher('./api/server', { signal, cache: 'no-store' })
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const current = await response.json() as Server | null
      if (current?.managed && current.url === '/api/rpc' && typeof current.address === 'string') return { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address: current.address, ...(current.remoteProxy === '/api/remote-rpc' ? { remoteProxy: current.remoteProxy } : {}) }
    }
  } catch (error) { if (signal?.aborted) throw error }
  return native
}
