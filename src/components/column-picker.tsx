import { Columns3 } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { columns, compactColumns, fullColumns } from '@/lib/torrent-columns'

export function ColumnPicker({ visible, onChange }: { visible: string[]; onChange: (columns: string[]) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="column-picker" aria-label="显示列"><Columns3 data-icon="inline-start" /><span className="column-picker-label">显示列</span></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="column-menu">
      <DropdownMenuGroup><DropdownMenuItem onSelect={() => onChange([...fullColumns])}>完整列</DropdownMenuItem><DropdownMenuItem onSelect={() => onChange([...compactColumns])}>紧凑列</DropdownMenuItem></DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup><DropdownMenuLabel>自定义桌面列 · 名称始终显示</DropdownMenuLabel>{columns.slice(1).map(column => <DropdownMenuCheckboxItem key={column.key} checked={visible.includes(column.key)} onSelect={event => event.preventDefault()} onCheckedChange={checked => onChange(checked ? [...visible, column.key] : visible.filter(key => key !== column.key))}>{column.label}</DropdownMenuCheckboxItem>)}</DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
}
