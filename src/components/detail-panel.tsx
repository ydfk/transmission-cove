import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import { SettingsForm } from './forms'
import { FileTree } from './file-tree'
import { torrentSettings } from '@/lib/settings'
import { bytes, dateTime, ratio, speed, statusText } from '@/lib/format'
import { DETAIL_FIELDS, type RpcClient, type RpcValues, type Torrent } from '@/lib/types'

function Trackers({ torrent, execute, pending }: { torrent: Torrent; execute: (method: string, params: RpcValues) => Promise<unknown>; pending: boolean }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(torrent.tracker_list ?? '')
  return <><div className="detail-toolbar"><span className="muted text-sm">{torrent.tracker_stats?.length ?? 0} 个 Tracker</span><Button size="sm" variant="outline" disabled={pending} onClick={() => { setValue(torrent.tracker_list ?? ''); setEditing(!editing) }}>{editing ? '取消编辑' : '编辑 Tracker'}</Button></div>{editing ? <form onSubmit={async event => { event.preventDefault(); try { await execute('torrent_set', { ids: [torrent.hash_string], tracker_list: value }); setEditing(false) } catch {} }}><Textarea aria-label="Tracker 地址" rows={5} value={value} onChange={event => setValue(event.target.value)} /><div className="form-footer"><span className="muted text-xs">每行一个地址，空行分隔分组。</span><Button disabled={pending}>保存 Tracker</Button></div></form> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>地址</th><th>状态</th><th>做种 / 下载</th><th>下次通告</th></tr></thead><tbody>{torrent.tracker_stats?.map(tracker => <tr key={tracker.id}><td><div className="break-all">{tracker.announce}</div><small className="muted">分组 {tracker.tier + 1}</small></td><td>{tracker.last_announce_result || '等待通告'}</td><td>{tracker.seeder_count < 0 ? '—' : tracker.seeder_count} / {tracker.leecher_count < 0 ? '—' : tracker.leecher_count}</td><td>{dateTime(tracker.next_announce_time)}</td></tr>)}</tbody></table></div>}</>
}

export function DetailPanel({ hash, client, execute, pending, onClose }: { hash: string; client: RpcClient; execute: (method: string, params: RpcValues) => Promise<unknown>; pending: boolean; onClose: () => void }) {
  const [height, setHeight] = useState(320)
  const detail = useQuery({ queryKey: ['detail', hash], queryFn: async ({ signal }) => (await client.call<{ torrents: Torrent[] }>('torrent_get', { ids: [hash], fields: [...DETAIL_FIELDS, ...(client.modern ? ['sequential_download'] : [])] }, signal)).torrents[0], retry: false, refetchInterval: () => document.hidden ? 30000 : 5000 })
  const torrent = detail.data
  return <section className="detail-panel" style={{ height }} aria-label="任务详情">
    <div className="detail-resize" role="separator" tabIndex={0} aria-label="调整详情高度" aria-orientation="horizontal" aria-valuemin={200} aria-valuemax={650} aria-valuenow={height} onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setHeight(value => Math.max(200, Math.min(650, value + (event.key === 'ArrowUp' ? 20 : -20)))) } }} onPointerDown={event => { event.preventDefault(); const start = event.clientY, original = height; const move = (e: PointerEvent) => setHeight(Math.max(200, Math.min(window.innerHeight * 0.7, original + start - e.clientY))); const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end) }; document.addEventListener('pointermove', move); document.addEventListener('pointerup', end) }} />
    <div className="detail-title"><strong className="truncate">{torrent?.name ?? '任务详情'}</strong><Button variant="ghost" size="icon-sm" aria-label="关闭详情" onClick={onClose}><X /></Button></div>
    {detail.isPending ? <Skeleton className="m-4 h-32" /> : detail.error ? <Alert variant="destructive"><AlertDescription>{detail.error.message}</AlertDescription></Alert> : !torrent ? <p className="p-4 muted">此任务已被移除。</p> : <Tabs defaultValue="overview" className="detail-tabs"><TabsList className="mx-4"><TabsTrigger value="overview">概览</TabsTrigger><TabsTrigger value="files">文件</TabsTrigger><TabsTrigger value="trackers">Tracker</TabsTrigger><TabsTrigger value="peers">Peers</TabsTrigger><TabsTrigger value="options">选项</TabsTrigger></TabsList>
      <TabsContent value="overview" className="detail-content">{torrent.error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{torrent.error_string}</AlertDescription></Alert> : null}<dl className="overview-grid">{[
        ['状态', statusText(torrent.status, torrent.error)], ['总大小', bytes(torrent.total_size)], ['已下载', bytes(torrent.downloaded_ever)], ['已上传', bytes(torrent.uploaded_ever)], ['分享率', ratio(torrent.upload_ratio)], ['连接数', torrent.peers_connected], ['下载目录', torrent.download_dir], ['添加时间', dateTime(torrent.added_date)], ['创建者', String(torrent.creator ?? '—')], ['私有种子', torrent.is_private ? '是' : '否'], ['分块', `${torrent.piece_count ?? '—'} × ${bytes(Number(torrent.piece_size ?? 0))}`], ['备注', torrent.comment || '—'],
      ].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd title={String(value)}>{value}</dd></div>)}</dl><div className="hash-line"><span>Hash</span><code>{torrent.hash_string}</code><Button size="icon-xs" variant="ghost" aria-label="复制磁力链接" onClick={async () => { try { await navigator.clipboard.writeText(torrent.magnet_link ?? `magnet:?xt=urn:btih:${hash}`); toast.success('已复制磁力链接') } catch { toast.error('浏览器未允许剪贴板，请从详情中选择 Hash 复制') } }}><Copy /></Button></div></TabsContent>
      <TabsContent value="files" className="detail-content"><FileTree torrent={torrent} execute={execute} pending={pending} /></TabsContent>
      <TabsContent value="trackers" className="detail-content"><Trackers torrent={torrent} execute={execute} pending={pending} /></TabsContent>
      <TabsContent value="peers" className="detail-content"><div className="data-table-wrap"><table className="data-table"><thead><tr><th>地址</th><th>客户端</th><th>进度</th><th>下载</th><th>上传</th><th>连接</th></tr></thead><tbody>{torrent.peers?.map(peer => <tr key={peer.address}><td>{peer.address}</td><td>{peer.client_name}</td><td>{Math.round(peer.progress * 100)}%</td><td>{speed(peer.rate_to_client)}</td><td>{speed(peer.rate_to_peer)}</td><td>{peer.flag_str}{peer.is_encrypted ? ' · 加密' : ''}</td></tr>)}</tbody></table>{!torrent.peers?.length ? <p className="p-6 text-center muted">暂无连接的 Peer</p> : null}</div></TabsContent>
      <TabsContent value="options" className="detail-content"><SettingsForm settings={torrentSettings} initial={torrent} pending={pending} onSave={params => execute('torrent_set', { ...params, ids: [hash] })} /></TabsContent>
    </Tabs>}
  </section>
}
