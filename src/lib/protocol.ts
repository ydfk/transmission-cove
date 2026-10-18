import type { RpcValues } from './types'

const camel = (key: string) => key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
const kebab = (key: string) => key.replaceAll('_', '-')
const torrentKebab = new Set(['peer_limit', 'files_wanted', 'files_unwanted', 'priority_high', 'priority_low', 'priority_normal', 'tracker_add', 'tracker_remove', 'tracker_replace'])
const sessionCamel = new Set(['seed_ratio_limit', 'seed_ratio_limited'])

export function legacyKey(key: string, method: string): string {
  if (key === 'cache_size_mib') return 'cache-size-mb'
  if (['torrent_get', 'torrent_set'].includes(method)) return torrentKebab.has(key) ? kebab(key) : camel(key)
  if (method === 'torrent_add') return key === 'bandwidth_priority' ? camel(key) : kebab(key)
  if (method.startsWith('session_')) return sessionCamel.has(key) ? camel(key) : kebab(key)
  if (method === 'group_set' && key === 'honors_session_limits') return camel(key)
  return kebab(key)
}

export function legacyParams(method: string, params: RpcValues): RpcValues {
  return Object.fromEntries(Object.entries(params).map(([key, value]) => {
    if (key === 'fields' && Array.isArray(value)) value = value.map(field => legacyKey(String(field), method))
    if (key === 'ids' && value === 'recently_active') value = 'recently-active'
    if (key === 'encryption' && value === 'allowed') value = 'tolerated'
    return [legacyKey(key, method), value]
  }))
}

export function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    let normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replaceAll('-', '_').toLowerCase()
    if (normalized === 'cache_size_mb') normalized = 'cache_size_mib'
    return [normalized, key === 'encryption' && item === 'tolerated' ? 'allowed' : normalize(item)]
  }))
}
