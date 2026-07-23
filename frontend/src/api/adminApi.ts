import { api } from '../lib/api'
import type { AdminOverview } from '../lib/types'

export const adminApi = {
  progress: () => api.get<AdminOverview>('/admin/progress'),
}
