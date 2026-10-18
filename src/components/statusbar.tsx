import { ArrowDown, ArrowUp, Turtle } from 'lucide-react'
import { Button } from './ui/button'
import { speed } from '@/lib/format'
import { limitText } from '@/lib/limits'
import type { RpcValues, Server } from '@/lib/types'
import { version } from '../../package.json'

export function Statusbar({ session, download, upload, server, demo, disabled, onToggle }: { session?: RpcValues; download: number; upload: number; server: Server; demo: boolean; disabled: boolean; onToggle: () => void }) {
  const address = demo ? '演示数据（未连接服务器）' : server.address ?? new URL(server.url, location.href).href
  return <footer className="statusbar" aria-label="连接与速度状态">
    <div className="status-transfer"><span className="download-text"><ArrowDown />{speed(download)}</span><span className="upload-text"><ArrowUp />{speed(upload)}</span></div>
    <div className="status-limits"><Button variant={session?.alt_speed_enabled ? 'secondary' : 'ghost'} size="icon-sm" aria-label="切换备用限速" aria-pressed={!!session?.alt_speed_enabled} disabled={disabled} onClick={onToggle}><Turtle /></Button><span>限速 ↓ {limitText(session, 'down')} · ↑ {limitText(session, 'up')}</span></div>
    <span className="status-address" title={address}>服务器 {address}</span>
    <span className="status-tr-version">TR {String(session?.version ?? '—')}</span><span className="status-web-version">Web {version}</span>
  </footer>
}
