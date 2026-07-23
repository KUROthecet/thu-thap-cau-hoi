import { useEffect, useState } from 'react'
import { taxonomyApi } from '../api/taxonomyApi'
import type { LookupOption } from '../lib/types'

interface UseLookupsResult {
  expectedBehaviors: LookupOption[]
  reviewStatuses: LookupOption[]
  loading: boolean
}

export function useLookups(): UseLookupsResult {
  const [expectedBehaviors, setExpectedBehaviors] = useState<LookupOption[]>([])
  const [reviewStatuses, setReviewStatuses] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([taxonomyApi.listExpectedBehaviors(), taxonomyApi.listReviewStatuses()])
      .then(([behaviors, statuses]) => {
        setExpectedBehaviors(behaviors.data)
        setReviewStatuses(statuses.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return { expectedBehaviors, reviewStatuses, loading }
}
