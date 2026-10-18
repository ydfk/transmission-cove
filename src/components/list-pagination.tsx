import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { pageSizes } from '@/lib/pagination'

export function ListPagination({ total, page, pages, start, end, size, onPage, onSize }: { total: number; page: number; pages: number; start: number; end: number; size: number; onPage: (page: number) => void; onSize: (size: number) => void }) {
  const [custom, setCustom] = useState(false)
  const [draft, setDraft] = useState('75')
  const sizeValue = custom || (size !== 0 && !pageSizes.includes(size)) ? 'custom' : String(size)
  return <nav className="list-pagination" aria-label="任务分页">
    <span className="page-range">{total ? start + 1 : 0}–{end} / {total} 个任务</span>
    <div className="page-size"><span>每页</span><Select value={sizeValue} onValueChange={value => { if (value === 'custom') { setDraft(String(size || 75)); setCustom(true) } else { setCustom(false); onSize(Number(value)) } }}><SelectTrigger size="sm" aria-label="每页数量"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{pageSizes.map(value => <SelectItem key={value} value={String(value)}>{value} 条</SelectItem>)}<SelectItem value="0">全部</SelectItem><SelectItem value="custom">自定义{!custom && sizeValue === 'custom' ? ` · ${size}` : ''}</SelectItem></SelectGroup></SelectContent></Select>
      {custom ? <form className="custom-page-size" onSubmit={event => { event.preventDefault(); const next = Number(draft); if (Number.isInteger(next) && next > 0 && next <= 10000) { onSize(next); setCustom(false) } }}><Input aria-label="自定义每页数量" type="number" min={1} max={10000} required value={draft} onChange={event => setDraft(event.target.value)} /><Button size="sm" variant="outline">应用</Button></form> : null}
    </div>
    <div className="page-controls"><Button size="icon-sm" variant="ghost" aria-label="第一页" disabled={page === 1} onClick={() => onPage(1)}><ChevronsLeft /></Button><Button size="icon-sm" variant="outline" aria-label="上一页" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft /></Button><span aria-live="polite">{page} / {pages}</span><Button size="icon-sm" variant="outline" aria-label="下一页" disabled={page === pages} onClick={() => onPage(page + 1)}><ChevronRight /></Button><Button size="icon-sm" variant="ghost" aria-label="最后一页" disabled={page === pages} onClick={() => onPage(pages)}><ChevronsRight /></Button></div>
  </nav>
}
