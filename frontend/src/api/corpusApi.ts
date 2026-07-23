import { api } from '../lib/api'
import type { ChunkSummary, DocumentOut, ImportResult } from '../lib/types'

export const corpusApi = {
  searchChunks: (query: string) =>
    api.get<ChunkSummary[]>('/corpus/chunks', { params: { q: query || undefined } }),
  listDocuments: () => api.get<DocumentOut[]>('/admin/corpus/documents'),
  importCorpus: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ImportResult>('/admin/corpus/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
