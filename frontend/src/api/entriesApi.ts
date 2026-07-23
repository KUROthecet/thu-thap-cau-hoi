import { api } from '../lib/api'
import type { QaEntry, QaEntryCreateResult, QaEntryUpsertRequest } from '../lib/types'

export const entriesApi = {
  list: (subgroupId: number) =>
    api.get<QaEntry[]>('/workspace/entries', { params: { subgroup_id: subgroupId } }),
  create: (payload: QaEntryUpsertRequest) =>
    api.post<QaEntryCreateResult>('/workspace/entries', payload),
  update: (entryId: string, payload: QaEntryUpsertRequest) =>
    api.patch<QaEntry>(`/workspace/entries/${entryId}`, payload),
  remove: (entryId: string) => api.delete(`/workspace/entries/${entryId}`),
}
