import { ArrowDownToLine, ArrowUpFromLine, CircleAlert, Clock3, Pause, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Torrent } from '@/lib/types'

export function TorrentStatusIcon({ torrent }: { torrent: Torrent }) {
  const state = torrent.error ? 'error' : torrent.status === 0 ? 'paused' : [1, 2].includes(torrent.status) ? 'checking' : torrent.status === 4 ? 'downloading' : torrent.status === 6 ? 'completed' : 'waiting'
  const Icon = { error: CircleAlert, paused: Pause, checking: ScanLine, downloading: ArrowDownToLine, completed: ArrowUpFromLine, waiting: Clock3 }[state]
  return <Icon aria-hidden="true" className={cn('task-icon', `status-${state}`)} />
}
