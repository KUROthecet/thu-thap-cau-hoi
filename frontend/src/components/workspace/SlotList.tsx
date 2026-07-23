import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { QaEntry } from '../../lib/types'

interface SlotListProps {
  entries: QaEntry[]
  targetCount: number
  onEdit: (entry: QaEntry) => void
  onDelete: (entry: QaEntry) => void
}

function citationLabel(citation: QaEntry['citations'][number]): string {
  return `${citation.manual_doc_name ?? '—'} · ${citation.manual_location ?? '—'}`
}

export default function SlotList({ entries, targetCount, onEdit, onDelete }: SlotListProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const slotCount = Math.max(targetCount, entries.length)
  const bySlot = new Map(entries.map((entry) => [entry.slot_index, entry]))

  return (
    <div>
      {Array.from({ length: slotCount }, (_, i) => i + 1).map((slotIndex) => {
        const entry = bySlot.get(slotIndex)
        if (!entry) {
          return (
            <div className="slot-card empty" key={`empty-${slotIndex}`}>
              <div className="slot-card-top">
                <span className="slot-card-index">{slotIndex}</span>
                <span className="slot-card-query">Ô trống — chưa nhập câu hỏi thứ {slotIndex}</span>
              </div>
            </div>
          )
        }

        const isOpen = openId === entry.entry_id
        const mustHave = entry.citations.filter((c) => c.kind === 'must_have')
        const optional = entry.citations.filter((c) => c.kind === 'optional')

        return (
          <div className={`slot-card filled${entry.is_extra ? ' extra' : ''}`} key={entry.entry_id}>
            <div className="slot-card-top" onClick={() => setOpenId(isOpen ? null : entry.entry_id)}>
              <span className="slot-card-index">{slotIndex}</span>
              <span className="slot-card-query truncate">{entry.query}</span>
              <span className="badge badge-default text-sm">{entry.review_status}</span>
              <div className="slot-card-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(entry)
                  }}
                  title="Sửa"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(entry)
                  }}
                  title="Xoá"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : undefined, color: 'var(--text-muted)' }} />
            </div>
            {isOpen && (
              <div className="slot-card-body">
                <div className="field-label-block">Trích dẫn bắt buộc ({mustHave.length})</div>
                <div className="field-value-block">
                  {mustHave.length === 0 && '—'}
                  {mustHave.map((citation) => (
                    <div key={citation.citation_id} style={{ marginBottom: 6 }}>
                      <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, color: 'var(--accent)' }}>
                        {citationLabel(citation)}
                      </div>
                      <ul style={{ margin: '3px 0 0', paddingLeft: 18 }}>
                        {citation.points.map((point) => (
                          <li key={point.point_id}>{point.content}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {optional.length > 0 && (
                  <>
                    <div className="field-label-block">Trích dẫn bổ trợ ({optional.length})</div>
                    <div className="field-value-block">
                      {optional.map((citation) => (
                        <div key={citation.citation_id} style={{ marginBottom: 6 }}>
                          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, color: 'var(--accent)' }}>
                            {citationLabel(citation)}
                          </div>
                          <ul style={{ margin: '3px 0 0', paddingLeft: 18 }}>
                            {citation.points.map((point) => (
                              <li key={point.point_id}>{point.content}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="field-label-block">Câu trả lời chuẩn</div>
                <div className="field-value-block">{entry.expert_gold_answer}</div>

                {entry.required_key_points.length > 0 && (
                  <>
                    <div className="field-label-block">Ý bắt buộc</div>
                    <div className="field-value-block">
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {entry.required_key_points.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {entry.safety_notes && (
                  <>
                    <div className="field-label-block">Lưu ý an toàn</div>
                    <div className="field-value-block">{entry.safety_notes}</div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
