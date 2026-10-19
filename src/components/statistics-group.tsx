import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { bytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { readStored, writeStored } from '@/lib/storage'
import type { RpcValues } from '@/lib/types'

function activeTime(value: number) {
  const seconds = Math.floor(value)
  return `${Math.floor(seconds / 86400)} 天 ${Math.floor(seconds % 86400 / 3600)} 时 ${Math.floor(seconds % 3600 / 60)} 分 ${seconds % 60} 秒`
}

const metrics = [
  { key: 'uploaded_bytes', label: '已上传', format: bytes },
  { key: 'downloaded_bytes', label: '已下载', format: bytes },
  { key: 'files_added', label: '已添加文件', format: (value: number) => value.toLocaleString('zh-CN') },
  { key: 'session_count', label: '会话次数', format: (value: number) => value.toLocaleString('zh-CN') },
  { key: 'seconds_active', label: '活动时间', format: activeTime },
]

export function StatisticsGroup({ title, values }: { title: string; values?: RpcValues }) {
  const [open, setOpen] = useState(() => readStored(`sidebar.stats.${title}`, true))
  return <Collapsible className="statistics-group" open={open} onOpenChange={value => { setOpen(value); writeStored(`sidebar.stats.${title}`, value) }}>
    <CollapsibleTrigger className="section-trigger" aria-label={`${open ? '收起' : '展开'}${title}`}><span>{title}</span><ChevronRight className={cn('section-chevron', open && 'expanded')} /></CollapsibleTrigger>
    <CollapsibleContent><dl className="statistics-values" aria-label={title}>{metrics.map(({ key, label, format }) => {
      const value = values?.[key]
      return <div key={key}><dt>{label}</dt><dd>{typeof value === 'number' && Number.isFinite(value) && value >= 0 ? format(value) : '—'}</dd></div>
    })}</dl></CollapsibleContent>
  </Collapsible>
}
