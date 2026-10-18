export function bytes(value = 0, base = 1024) {
  if (!Number.isFinite(value) || value < 0) return '—'
  const units = base === 1024 ? ['B', 'KiB', 'MiB', 'GiB', 'TiB'] : ['B', 'kB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(value || 1) / Math.log(base)), units.length - 1)
  return `${(value / base ** index).toLocaleString('en-US', { maximumFractionDigits: index ? 1 : 0 })} ${units[index]}`
}
export const speed = (value = 0) => `${bytes(value, 1000)}/s`
export function duration(seconds: number) {
  if (seconds < 0 || !Number.isFinite(seconds)) return '—'
  if (seconds < 60) return `${Math.floor(seconds)} 秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时 ${Math.floor(seconds % 3600 / 60)} 分`
  return `${Math.floor(seconds / 86400)} 天 ${Math.floor(seconds % 86400 / 3600)} 小时`
}
export const ratio = (value: number) => value === -2 ? '∞' : value < 0 ? '—' : value.toFixed(2)
export const statusText = (status: number, error = 0) => error ? '有错误' : ['已暂停', '等待校验', '校验中', '等待下载', '下载中', '等待做种', '做种中'][status] ?? '未知'
export const dateTime = (seconds: unknown) => Number(seconds) > 0 ? new Date(Number(seconds) * 1000).toLocaleString('zh-CN') : '—'
export const trackerHost = (url: string) => { try { return new URL(url).hostname } catch { return url } }
