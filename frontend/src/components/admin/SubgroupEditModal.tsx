import { X } from 'lucide-react'
import { useState } from 'react'
import { taxonomyApi } from '../../api/taxonomyApi'
import { extractErrorMessage } from '../../lib/api'
import type { Subgroup } from '../../lib/types'

interface SubgroupEditModalProps {
  subgroup: Subgroup
  onClose: () => void
  onSaved: () => void
}

export default function SubgroupEditModal({ subgroup, onClose, onSaved }: SubgroupEditModalProps) {
  const [name, setName] = useState(subgroup.name)
  const [purpose, setPurpose] = useState(subgroup.purpose)
  const [typicalRole, setTypicalRole] = useState(subgroup.typical_role ?? '')
  const [expectedRetrieval, setExpectedRetrieval] = useState(subgroup.expected_retrieval ?? '')
  const [targetCount, setTargetCount] = useState(subgroup.target_count)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await taxonomyApi.updateSubgroup(subgroup.subgroup_id, {
        name,
        purpose,
        typical_role: typicalRole,
        expected_retrieval: expectedRetrieval,
        target_count: targetCount,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể lưu thay đổi.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            Sửa {subgroup.code} — {subgroup.name}
          </span>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body flex-col gap-4">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Tên subgroup</label>
            <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mục đích (purpose)</label>
            <textarea className="form-textarea" rows={3} value={purpose} onChange={(event) => setPurpose(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Đối tượng hỏi thường gặp</label>
            <input className="form-input" value={typicalRole} onChange={(event) => setTypicalRole(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Kỳ vọng truy xuất (expected_retrieval)</label>
            <input
              className="form-input"
              value={expectedRetrieval}
              onChange={(event) => setExpectedRetrieval(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Số câu mục tiêu / bác sĩ</label>
            <input
              type="number"
              min={1}
              className="form-input"
              value={targetCount}
              onChange={(event) => setTargetCount(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}
