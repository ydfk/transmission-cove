import type { Credentials, Server } from './types'
import { requestUrl } from './request-url'

const key = 'transmission-web.v1.auth.session'
export interface AuthSession { endpoint: string; credentials: Credentials }

export function authEndpoint(server: Server): string {
  return requestUrl(server.remoteTarget ?? server.address ?? server.url)
}

export function readAuthSession(): AuthSession | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null') as AuthSession | null
    if (typeof value?.endpoint === 'string' && typeof value.credentials?.username === 'string' && typeof value.credentials.password === 'string') return value
  } catch { /* 存储不可用或记录损坏时重新登录。 */ }
  return undefined
}

export function saveAuthSession(server: Server, credentials?: Credentials): AuthSession | undefined {
  const value = credentials ? { endpoint: authEndpoint(server), credentials } : undefined
  // 仅保留当前标签页、当前目标的凭据；不写入长期 localStorage。
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value))
    else sessionStorage.removeItem(key)
  } catch { /* 隐私模式下仍可在内存中使用本次登录。 */ }
  return value
}
