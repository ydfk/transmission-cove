import { useState } from 'react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Field, FieldGroup, FieldLabel } from './ui/field'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from './ui/alert-dialog'
import { Modal, TextField } from './forms'
import type { RpcValues } from '@/lib/types'

export function ActionDialog({ action, hashes, initialDirectory, initialLabels, execute, pending, onClose }: { action: string; hashes: string[]; initialDirectory: string; initialLabels: string; execute: (method: string, params: RpcValues) => Promise<unknown>; pending: boolean; onClose: () => void }) {
  const [deleteData, setDeleteData] = useState(false)
  const [value, setValue] = useState(action === 'labels' ? initialLabels : initialDirectory)
  const [move, setMove] = useState(false)
  async function submit() { try { await execute(action === 'remove' ? 'torrent_remove' : action === 'labels' ? 'torrent_set' : 'torrent_set_location', { ids: hashes, ...(action === 'remove' ? { delete_local_data: deleteData } : action === 'labels' ? { labels: value.split(',').map(v => v.trim()).filter(Boolean) } : { location: value.trim(), move }) }); onClose() } catch {} }
  if (action === 'remove') return <AlertDialog open onOpenChange={open => { if (!open && !pending) onClose() }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>删除 {hashes.length} 个任务？</AlertDialogTitle><AlertDialogDescription>{deleteData ? '这些任务及其在 NAS 上的下载文件将被删除，此操作无法撤销。' : '任务会从 Transmission 中移除，NAS 上已下载的文件将保留。'}</AlertDialogDescription></AlertDialogHeader><Field orientation="horizontal"><Checkbox id="delete-data" checked={deleteData} onCheckedChange={value => setDeleteData(!!value)} /><FieldLabel htmlFor="delete-data">同时删除下载文件</FieldLabel></Field><AlertDialogFooter><AlertDialogCancel disabled={pending}>取消</AlertDialogCancel><Button variant="destructive" disabled={pending} onClick={submit}>{pending ? '正在删除…' : deleteData ? '删除任务和文件' : '仅删除任务'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  return <Modal title={action === 'labels' ? '编辑标签' : '更改下载目录'} description={`应用于已选择的 ${hashes.length} 个任务。${action === 'labels' ? '此操作将替换这些任务现有的标签。' : '路径是 NAS 上的绝对路径。'}`} onClose={() => { if (!pending) onClose() }}><form onSubmit={event => { event.preventDefault(); void submit() }}><FieldGroup><TextField label={action === 'labels' ? '标签（英文逗号分隔）' : '目标目录'} required={action !== 'labels'} value={value} onChange={event => setValue(event.target.value)} />{action === 'location' ? <Field orientation="horizontal"><Checkbox id="move-files" checked={move} onCheckedChange={value => setMove(!!value)} /><FieldLabel htmlFor="move-files">移动现有文件（未选中时只在目标目录查找）</FieldLabel></Field> : null}</FieldGroup><div className="form-footer"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>取消</Button><Button disabled={pending}>保存</Button></div></form></Modal>
}
