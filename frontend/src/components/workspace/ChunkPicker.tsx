import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { corpusApi } from '../../api/corpusApi'
import type { ChunkSummary } from '../../lib/types'

interface ChunkPickerProps {
  selectedChunk: ChunkSummary | null
  onSelect: (chunk: ChunkSummary) => void
}

export default function ChunkPicker({ selectedChunk, onSelect }: ChunkPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChunkSummary[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearching(true)
      corpusApi
        .searchChunks(query)
        .then((response) => setResults(response.data))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: 12, color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 32 }}
          placeholder="Tìm đoạn guideline theo từ khoá hoặc mục..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {searching && <div className="form-hint mt-2">Đang tìm...</div>}
      {!searching && results.length > 0 && (
        <div className="flex-col gap-2 mt-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
          {results.map((chunk) => (
            <button
              key={chunk.chunk_id}
              type="button"
              className="citation-preview"
              style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
              onClick={() => onSelect(chunk)}
            >
              <div className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                {chunk.doc_title} · {chunk.location_label}
              </div>
              <div className="mt-2">{chunk.content}</div>
            </button>
          ))}
        </div>
      )}
      {selectedChunk && (
        <div className="citation-preview filled mt-2">
          <div className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
            Đã chọn: {selectedChunk.doc_title} · {selectedChunk.location_label}
          </div>
          <div className="mt-2">{selectedChunk.content}</div>
        </div>
      )}
    </div>
  )
}
