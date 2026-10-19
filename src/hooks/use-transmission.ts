import { useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LIST_FIELDS, type RpcClient, type RpcValues, type Torrent, type SessionStats } from '@/lib/types'

export function useTransmission(client: RpcClient, includeTrackerCounts = false) {
  const queryClient = useQueryClient()
  const cache = useRef(new Map<string, Torrent>())
  const cycle = useRef(0)
  const session = useQuery({ queryKey: ['session'], queryFn: ({ signal }) => client.connect(signal), retry: false, refetchInterval: 30000 })
  const statistics = useQuery({ queryKey: ['statistics'], enabled: session.isSuccess, queryFn: ({ signal }) => client.call<SessionStats>('session_stats', undefined, signal), refetchInterval: () => document.hidden ? 30000 : 10000 })
  const trackerCounts = useQuery({
    queryKey: ['tracker-counts'], enabled: session.isSuccess && includeTrackerCounts, retry: false, staleTime: 30000, refetchInterval: 30000,
    queryFn: ({ signal }) => client.call<{ torrents: Pick<Torrent, 'hash_string' | 'tracker_stats'>[] }>('torrent_get', { fields: ['hash_string', 'tracker_stats'] }, signal),
  })
  const torrents = useQuery({
    queryKey: ['torrents'], enabled: session.isSuccess, retry: false,
    refetchInterval: () => document.hidden ? 30000 : 3000,
    queryFn: async ({ signal }) => {
      const full = cycle.current++ % 20 === 0
      const result = await client.call<{ torrents: Torrent[]; removed?: number[] }>('torrent_get', { fields: LIST_FIELDS, ...(full ? {} : { ids: 'recently_active' }) }, signal)
      const next = full ? new Map<string, Torrent>() : new Map(cache.current)
      const removed = new Set(result.removed ?? [])
      for (const [hash, torrent] of next) if (removed.has(torrent.id)) next.delete(hash)
      for (const torrent of result.torrents) next.set(torrent.hash_string, torrent)
      cache.current = next
      return [...next.values()]
    },
  })
  const listedTorrents = useMemo(() => {
    if (!includeTrackerCounts) return torrents.data
    const counts = new Map(trackerCounts.isError ? [] : trackerCounts.data?.torrents.map(torrent => [torrent.hash_string, torrent.tracker_stats]))
    return torrents.data?.map(torrent => ({ ...torrent, tracker_stats: counts.get(torrent.hash_string) }))
  }, [torrents.data, includeTrackerCounts, trackerCounts.data, trackerCounts.isError])
  const refresh = async () => {
    cycle.current = 0
    await queryClient.invalidateQueries({ queryKey: ['torrents'] })
    await queryClient.invalidateQueries({ queryKey: ['detail'] })
    await queryClient.invalidateQueries({ queryKey: ['tracker-counts'] })
  }
  const mutation = useMutation({
    mutationFn: ({ method, params }: { method: string; params?: RpcValues }) => client.call(method, params),
    onSuccess: async (_, { method }) => { toast.success('操作已完成'); await refresh(); if (method.startsWith('session_')) await queryClient.invalidateQueries({ queryKey: ['session'] }) },
    onError: (error: Error) => toast.error(error.message),
  })
  return { session, torrents: { ...torrents, data: listedTorrents }, statistics, refresh, mutation }
}
