import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/adminApi'
import type { AdminOverview } from '../lib/types'

interface UseAdminOverviewResult {
  overview: AdminOverview | null
  loading: boolean
  refresh: () => Promise<void>
}

export function useAdminOverview(): UseAdminOverviewResult {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const response = await adminApi.progress()
    setOverview(response.data)
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  return { overview, loading, refresh }
}
