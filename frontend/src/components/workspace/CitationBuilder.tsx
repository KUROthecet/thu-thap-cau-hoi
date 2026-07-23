import { Plus, X } from 'lucide-react'
import type { ChunkSummary, CitationDraft } from '../../lib/types'
import ChunkPicker from './ChunkPicker'

interface CitationBuilderProps {
  kind: 'must_have' | 'optional'
  citations: CitationDraft[]
  onChange: (citations: CitationDraft[]) => void
}

function emptyCitation(kind: 'must_have' | 'optional'): CitationDraft {
  return { kind, chunk_id: null, manual_doc_name: null, manual_location: null, points: [''], chunkPreview: null }
}

export default function CitationBuilder({ kind, citations, onChange }: CitationBuilderProps) {
  function addCitation() {
    onChange([...citations, emptyCitation(kind)])
  }

  function updateCitation(index: number, updated: Partial<CitationDraft>) {
    const next = citations.slice()
    next[index] = { ...next[index], ...updated }
    onChange(next)
  }

  function removeCitation(index: number) {
    onChange(citations.filter((_, i) => i !== index))
  }

  function setMode(index: number, mode: 'corpus' | 'manual') {
    if (mode === 'corpus') {
      updateCitation(index, { manual_doc_name: null, manual_location: null })
    } else {
      updateCitation(index, { chunk_id: null, chunkPreview: null, manual_doc_name: '', manual_location: '' })
    }
  }

  function onChunkSelected(index: number, chunk: ChunkSummary) {
    updateCitation(index, { chunk_id: chunk.chunk_id, chunkPreview: chunk })
  }

  function updatePoint(index: number, pointIndex: number, value: string) {
    const citation = citations[index]
    const points = citation.points.slice()
    points[pointIndex] = value
    updateCitation(index, { points })
  }

  function addPoint(index: number) {
    const citation = citations[index]
    updateCitation(index, { points: [...citation.points, ''] })
  }

  function removePoint(index: number, pointIndex: number) {
    const citation = citations[index]
    updateCitation(index, { points: citation.points.filter((_, i) => i !== pointIndex) })
  }

  return (
    <div>
      {citations.map((citation, index) => {
        const mode = citation.manual_doc_name !== null || citation.manual_location !== null ? 'manual' : 'corpus'
        return (
          <div className="citation-block" key={index}>
            <div className="citation-block-head">
              <span className="citation-index">{index + 1}</span>
              <span className={`citation-kind-tag ${kind === 'must_have' ? 'must-have' : 'optional'}`}>
                {kind === 'must_have' ? 'Bắt buộc' : 'Bổ trợ'}
              </span>
              <div className="flex-1" />
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeCitation(index)}>
                <X size={13} /> Xoá
              </button>
            </div>

            <div className="citation-source-toggle">
              <button
                type="button"
                className={`btn btn-xs ${mode === 'corpus' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setMode(index, 'corpus')}
              >
                Chọn từ corpus
              </button>
              <button
                type="button"
                className={`btn btn-xs ${mode === 'manual' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setMode(index, 'manual')}
              >
                Nhập thủ công
              </button>
            </div>

            {mode === 'corpus' ? (
              <ChunkPicker
                selectedChunk={citation.chunkPreview}
                onSelect={(chunk) => onChunkSelected(index, chunk)}
              />
            ) : (
              <div className="flex gap-2 citation-manual-row" style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  className="form-input"
                  value={citation.manual_doc_name ?? ''}
                  onChange={(event) => updateCitation(index, { manual_doc_name: event.target.value })}
                />
                <input
                  type="text"
                  className="form-input"
                  value={citation.manual_location ?? ''}
                  onChange={(event) => updateCitation(index, { manual_location: event.target.value })}
                />
              </div>
            )}

            <div className="field-label-block">Các ý lấy từ trích dẫn này</div>
            {citation.points.map((point, pointIndex) => (
              <div className="point-row" key={pointIndex}>
                <span className="point-bullet">–</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Một ý cụ thể, VD: THA khi HA tâm thu ≥140 mmHg"
                  value={point}
                  onChange={(event) => updatePoint(index, pointIndex, event.target.value)}
                />
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => removePoint(index, pointIndex)}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <button type="button" className="add-dashed-btn" onClick={() => addPoint(index)}>
              <Plus size={12} /> Thêm ý
            </button>
          </div>
        )
      })}
      <button type="button" className="add-dashed-btn" onClick={addCitation}>
        <Plus size={13} /> Thêm trích dẫn {kind === 'must_have' ? 'bắt buộc' : 'bổ trợ'}
      </button>
    </div>
  )
}
