export function readStored<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(`transmission-web.v1.${key}`); return value ? JSON.parse(value) : fallback } catch { return fallback }
}
export function writeStored(key: string, value: unknown) {
  try { localStorage.setItem(`transmission-web.v1.${key}`, JSON.stringify(value)) } catch { /* 隐私模式下保持本次会话可用。 */ }
}
