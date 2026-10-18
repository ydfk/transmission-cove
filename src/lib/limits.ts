import type { RpcValues } from './types'

export function limitText(session: RpcValues | undefined, direction: 'down' | 'up') {
  if (!session) return '—'
  if (session.alt_speed_enabled) return `${Number(session[`alt_speed_${direction}`] ?? 0)} kB/s`
  return session[`speed_limit_${direction}_enabled`] ? `${Number(session[`speed_limit_${direction}`] ?? 0)} kB/s` : '不限速'
}
