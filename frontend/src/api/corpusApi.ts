import { api } from '../lib/api'
import type { ChunkSummary } from '../lib/types'

export const corpusApi = {
  searchChunks: (query: string) =>
    api.get<ChunkSummary[]>('/corpus/chunks', { params: { q: query || undefined } }),
}
