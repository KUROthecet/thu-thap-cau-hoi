import { Download } from 'lucide-react'
import { useState } from 'react'
import { exportApi } from '../../api/exportApi'
import type { DoctorProgress, QuestionGroup } from '../../lib/types'

interface ExportPanelProps {
  doctors: DoctorProgress[]
  groups: QuestionGroup[]
  presetDoctorId: number | null
}

export default function ExportPanel({ doctors, groups, presetDoctorId }: ExportPanelProps) {
  const [doctorId, setDoctorId] = useState<string>(presetDoctorId ? String(presetDoctorId) : '')
  const [subgroupId, setSubgroupId] = useState<string>('')
  const [reviewStatus, setReviewStatus] = useState<string>('')

  async function handleDownload(format: 'csv' | 'json') {
    await exportApi.download({
      format,
      doctorId: doctorId ? Number(doctorId) : undefined,
      subgroupId: subgroupId ? Number(subgroupId) : undefined,
      reviewStatus: reviewStatus || undefined,
    })
  }

  return (
    <div className="card">
      <div className="admin-section-title">Xuất dữ liệu</div>
      <p className="admin-section-subtitle">Lọc theo bác sĩ / loại câu hỏi / trạng thái duyệt, rồi xuất CSV hoặc JSON chuẩn hoá cho khâu đánh giá.</p>

      <div className="filter-bar">
        <select className="form-select" value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
          <option value="">Tất cả bác sĩ</option>
          {doctors.map((doctor) => (
            <option key={doctor.user_id} value={doctor.user_id}>
              {doctor.full_name}
            </option>
          ))}
        </select>
        <select className="form-select" value={subgroupId} onChange={(event) => setSubgroupId(event.target.value)}>
          <option value="">Tất cả loại câu hỏi</option>
          {groups.map((group) => (
            <optgroup key={group.group_id} label={`${group.code} · ${group.name}`}>
              {group.subgroups.map((subgroup) => (
                <option key={subgroup.subgroup_id} value={subgroup.subgroup_id}>
                  {subgroup.code} · {subgroup.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select className="form-select" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
          <option value="">Mọi trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="expert_reviewed">Chuyên gia đã duyệt</option>
          <option value="needs_revision">Cần chỉnh sửa</option>
          <option value="approved">Đã chốt</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={() => handleDownload('json')}>
          <Download size={14} /> JSON
        </button>
        <button type="button" className="btn" onClick={() => handleDownload('csv')}>
          <Download size={14} /> CSV
        </button>
      </div>
    </div>
  )
}
