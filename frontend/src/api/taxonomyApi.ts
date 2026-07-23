import { api } from '../lib/api'
import type { LookupOption, QuestionGroup, Subgroup, UpdateSubgroupRequest } from '../lib/types'

export const taxonomyApi = {
  listGroups: () => api.get<QuestionGroup[]>('/taxonomy/groups'),
  listExpectedBehaviors: () => api.get<LookupOption[]>('/taxonomy/expected-behaviors'),
  listReviewStatuses: () => api.get<LookupOption[]>('/taxonomy/review-statuses'),
  updateSubgroup: (subgroupId: number, payload: UpdateSubgroupRequest) =>
    api.patch<Subgroup>(`/admin/subgroups/${subgroupId}`, payload),
}
