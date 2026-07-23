import { Pencil } from 'lucide-react'
import { useState } from 'react'
import type { QuestionGroup, Subgroup } from '../../lib/types'
import SubgroupEditModal from './SubgroupEditModal'

interface SubgroupManagerProps {
  groups: QuestionGroup[]
  onChanged: () => void
}

export default function SubgroupManager({ groups, onChanged }: SubgroupManagerProps) {
  const [editing, setEditing] = useState<Subgroup | null>(null)

  return (
    <div className="card">
      <div className="admin-section-title">Quản lý 24 loại câu hỏi</div>
      <p className="admin-section-subtitle">
        Sửa tên, mục đích, đối tượng hỏi và số câu mục tiêu cho từng subgroup. Cấu trúc 6 group ×
        4 subgroup được giữ cố định theo khung phân loại đã chốt.
      </p>

      <div>
        {groups.map((group) => (
          <div key={group.group_id}>
            <div className="manager-group-title">
              {group.code} · {group.name}
            </div>
            {group.subgroups.map((subgroup) => (
              <div key={subgroup.subgroup_id} className="manager-row">
                <span className="subgroup-nav-code">{subgroup.code}</span>
                <span className="flex-1 text-sm">{subgroup.name}</span>
                <span className="badge badge-default">mục tiêu {subgroup.target_count}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditing(subgroup)}>
                  <Pencil size={13} /> Sửa
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {editing && (
        <SubgroupEditModal
          subgroup={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            onChanged()
          }}
        />
      )}
    </div>
  )
}
