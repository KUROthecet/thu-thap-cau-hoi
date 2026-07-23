import { Trash2 } from 'lucide-react'
import type { DoctorProgress } from '../../lib/types'

const STATUS_LABEL: Record<DoctorProgress['status'], string> = {
  done: 'Hoàn thành',
  in_progress: 'Đang nhập',
  new: 'Chưa bắt đầu',
}

function initialsOf(name: string): string {
  const parts = name.replace(/^BS\.?\s*/i, '').trim().split(/\s+/)
  return (parts[parts.length - 1]?.[0] ?? 'B').toUpperCase()
}

interface DoctorsTableProps {
  doctors: DoctorProgress[]
  onSelectExport: (doctorId: number) => void
  onDelete: (doctorId: number) => void
}

export default function DoctorsTable({ doctors, onSelectExport, onDelete }: DoctorsTableProps) {
  function handleDelete(doctor: DoctorProgress) {
    if (!window.confirm(`Xoá bác sĩ "${doctor.full_name}"?\nTất cả câu hỏi đã nhập sẽ bị xoá vĩnh viễn.`)) return
    onDelete(doctor.user_id)
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Bác sĩ</th>
            <th>Chuyên khoa</th>
            <th>Tiến độ</th>
            <th className="text-center">Loại đủ 5/5</th>
            <th>Bản đồ 24 loại</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => {
            const pct = doctor.target_total > 0 ? Math.round((doctor.total_entries / doctor.target_total) * 100) : 0
            return (
              <tr key={doctor.user_id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="doctor-avatar">{initialsOf(doctor.full_name)}</span>
                    <span>
                      <b>{doctor.full_name}</b>
                      <small style={{ display: 'block', color: 'var(--text-muted)', fontFamily: 'ui-monospace, Menlo, monospace' }}>
                        {doctor.email}
                      </small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="badge badge-default">{doctor.specialty ?? '—'}</span>
                </td>
                <td>
                  <div className="progress-bar-cell">
                    <div className="bar">
                      <div className="fill" style={{ width: `${pct}%` }} />
                    </div>
                    <small className="tnum">
                      {doctor.total_entries}/{doctor.target_total}
                    </small>
                  </div>
                </td>
                <td className="text-center tnum">
                  {doctor.types_done}/{doctor.types_total}
                </td>
                <td>
                  <div className="minimap" title="24 loại — xanh: đủ, cam: đang nhập, xám: chưa có">
                    {doctor.minimap.map((item) => (
                      <i
                        key={item.subgroup_id}
                        className={item.done_count >= item.target_count ? 'done' : item.done_count > 0 ? 'partial' : ''}
                      />
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${doctor.status}`}>{STATUS_LABEL[doctor.status]}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => onSelectExport(doctor.user_id)}>
                      Xuất →
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      title="Xoá bác sĩ"
                      onClick={() => handleDelete(doctor)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          {doctors.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-state">
                Chưa có bác sĩ nào. Thêm bác sĩ đầu tiên phía trên.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
