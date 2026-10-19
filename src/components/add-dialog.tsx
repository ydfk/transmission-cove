import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './forms'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { Checkbox } from './ui/checkbox'
import { bytes } from '@/lib/format'
import type { RpcClient, RpcValues } from '@/lib/types'

export function AddDialog({ client, session, files: droppedFiles, onClose, onAdded }: { client: RpcClient; session: RpcValues; files: File[]; onClose: () => void; onAdded: () => Promise<void> }) {
  const [links, setLinks] = useState('')
  const [files, setFiles] = useState<File[]>(droppedFiles)
  const [directory, setDirectory] = useState(String(session.download_dir ?? ''))
  const [paused, setPaused] = useState(session.start_added_torrents === false)
  const [labels, setLabels] = useState('')
  const [busy, setBusy] = useState(false)
  const [freeSpace, setFreeSpace] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const urls = links.split(/\r?\n/).map(link => link.trim()).filter(Boolean)
    if (!files.length && !urls.length) { toast.error('请选择种子文件或填写链接'); return }
    if (urls.some(url => !/^(magnet:\?|https?:\/\/)/i.test(url))) { toast.error('仅支持磁力链接或 HTTP/HTTPS 种子 URL'); return }
    if (files.some(file => file.size > 16 * 1024 ** 2)) { toast.error('单个种子文件不能超过 16 MiB'); return }
    setBusy(true)
    const failedFiles: File[] = [], failedUrls: string[] = []
    let added = 0, duplicate = 0
    for (const source of [...files, ...urls]) {
      try {
        let content: RpcValues
        if (typeof source === 'string') content = { filename: source }
        else {
          const buffer = new Uint8Array(await source.arrayBuffer())
          let binary = ''
          for (let offset = 0; offset < buffer.length; offset += 8192) binary += String.fromCharCode(...buffer.subarray(offset, offset + 8192))
          content = { metainfo: btoa(binary) }
        }
        const result = await client.call('torrent_add', { ...content, ...(directory.trim() ? { download_dir: directory.trim() } : {}), paused, labels: labels.split(',').map(label => label.trim()).filter(Boolean) })
        if (result.torrent_duplicate) duplicate++; else added++
      } catch (error) { if (typeof source === 'string') failedUrls.push(source); else failedFiles.push(source); toast.error((error as Error).message) }
    }
    setBusy(false); setFiles(failedFiles); setLinks(failedUrls.join('\n'))
    if (added || duplicate) toast.success(`已添加 ${added} 个任务${duplicate ? `，${duplicate} 个已存在` : ''}`)
    await onAdded()
    if (!failedFiles.length && !failedUrls.length) onClose()
  }
  return <Modal title="添加下载任务" description="Torrent 文件、磁力链接或 URL，支持批量添加。" className="compact-dialog add-dialog" onClose={() => { if (!busy) onClose() }}>
    <form onSubmit={submit}><FieldGroup className="add-fields">
      <label className="upload-area" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); if (!busy) setFiles([...files, ...Array.from(event.dataTransfer.files)]) }}><UploadCloud /><div className="upload-copy"><strong>选择或拖入 Torrent 文件</strong><span title={files.map(file => file.name).join('、')}>{files.length ? `已选 ${files.length} 个 · ${files.map(file => file.name).join('、')}` : '每个文件最大 16 MiB'}</span></div><input aria-label="种子文件" type="file" accept=".torrent" multiple disabled={busy} onChange={event => setFiles([...files, ...Array.from(event.target.files ?? [])])} /></label>
      <Field><FieldLabel htmlFor="add-links">磁力链接或 URL</FieldLabel><Textarea id="add-links" rows={2} placeholder="每行一个链接" value={links} onChange={event => setLinks(event.target.value)} /></Field>
      <Field><div className="directory-field-heading"><FieldLabel htmlFor="add-directory">下载目录</FieldLabel><span className="muted" role="status">{freeSpace}</span><Button type="button" variant="ghost" size="xs" disabled={!directory || busy} onClick={async () => { try { const result = await client.call('free_space', { path: directory }); setFreeSpace(bytes(Number(result.size_bytes))) } catch (error) { toast.error((error as Error).message) } }}>检查可用空间</Button></div><Input id="add-directory" value={directory} onChange={event => { setDirectory(event.target.value); setFreeSpace('') }} placeholder="服务器默认目录" /></Field>
      <Field orientation="horizontal" className="add-label-field"><FieldLabel htmlFor="add-labels">标签</FieldLabel><Input id="add-labels" placeholder="可选，用英文逗号分隔" value={labels} onChange={event => setLabels(event.target.value)} /></Field>
    </FieldGroup><div className="form-footer add-footer"><Field orientation="horizontal" className="add-paused"><Checkbox id="add-paused" checked={paused} disabled={busy} onCheckedChange={value => setPaused(!!value)} /><FieldLabel htmlFor="add-paused" title="暂停添加后，可先选择要下载的文件">添加后暂停</FieldLabel></Field><div className="dialog-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>取消</Button><Button type="submit" disabled={busy}>{busy ? '正在添加…' : '添加任务'}</Button></div></div></form>
  </Modal>
}
