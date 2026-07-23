import { api } from '../lib/api'

export interface ExportFilters {
  format: 'csv' | 'json'
  doctorId?: number
  subgroupId?: number
  reviewStatus?: string
}

export const exportApi = {
  download: async (filters: ExportFilters): Promise<void> => {
    const response = await api.get('/export', {
      params: {
        format: filters.format,
        doctor_id: filters.doctorId,
        subgroup_id: filters.subgroupId,
        review_status: filters.reviewStatus,
      },
      responseType: 'blob',
    })
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dataset_builder_export.${filters.format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
