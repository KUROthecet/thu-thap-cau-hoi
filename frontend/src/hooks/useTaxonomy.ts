import { useCallback, useEffect, useState } from 'react'
import { taxonomyApi } from '../api/taxonomyApi'
import type { QuestionGroup } from '../lib/types'

interface UseTaxonomyResult {
  groups: QuestionGroup[]
  loading: boolean
  refresh: () => Promise<void>
}

export function useTaxonomy(): UseTaxonomyResult {
  const [groups, setGroups] = useState<QuestionGroup[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const response = await taxonomyApi.listGroups()
    setGroups(response.data)
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  return { groups, loading, refresh }
}
