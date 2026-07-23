import { useCallback, useEffect, useState } from 'react'
import { entriesApi } from '../api/entriesApi'
import type { QaEntry } from '../lib/types'

interface UseEntriesResult {
  entries: QaEntry[]
  loading: boolean
  refresh: () => Promise<void>
}

export function useEntries(subgroupId: number | null): UseEntriesResult {
  const [entries, setEntries] = useState<QaEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (subgroupId === null) {
      setEntries([])
      return
    }
    const response = await entriesApi.list(subgroupId)
    setEntries(response.data)
  }, [subgroupId])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  return { entries, loading, refresh }
}
