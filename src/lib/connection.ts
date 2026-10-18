import type { Server } from './types'

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
      if (current?.managed && current.url === '/api/rpc' && typeof current.address === 'string') return current
    }
  } catch (error) { if (signal?.aborted) throw error }
  return native
}
