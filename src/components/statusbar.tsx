import { ArrowDown, ArrowUp, Turtle } from 'lucide-react'
import { Button } from './ui/button'
import { speed } from '@/lib/format'
import { limitText } from '@/lib/limits'
import { requestUrl } from '@/lib/request-url'
import type { RpcValues, Server } from '@/lib/types'
import { WebVersion } from './web-version'

export function Statusbar({ session, download, upload, server, demo, disabled, onToggle, updates }: { session?: RpcValues; download: number; upload: number; server: Server; demo: boolean; disabled: boolean; onToggle: () => void; updates?: boolean }) {
  const address = demo ? '演示数据（未连接服务器）' : requestUrl(server.address ?? server.url)
  return <footer className="statusbar" aria-label="连接与速度状态">
    <div className="status-transfer"><span className="download-text" aria-label="下载速度与限速"><ArrowDown />{speed(download)}<span className="transfer-limit">/ {limitText(session, 'down')}</span></span><span className="upload-text" aria-label="上传速度与限速"><ArrowUp />{speed(upload)}<span className="transfer-limit">/ {limitText(session, 'up')}</span></span></div>
    <div className="status-limits"><Button variant={session?.alt_speed_enabled ? 'secondary' : 'ghost'} size="icon-sm" aria-label="切换备用限速" aria-pressed={!!session?.alt_speed_enabled} disabled={disabled} onClick={onToggle}><Turtle /></Button><span>{session?.alt_speed_enabled ? '备用限速' : '标准限速'}</span></div>
    <span className="status-address" title={address}>服务器 {address}</span>
    <span className="status-tr-version">TR {String(session?.version ?? '—')}</span><WebVersion service={updates} demo={demo} />
  </footer>
}
