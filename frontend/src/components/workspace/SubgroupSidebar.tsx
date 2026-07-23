import { subgroupStatusOf } from '../../lib/subgroupStatus'
import type { QuestionGroup, Subgroup } from '../../lib/types'

interface SubgroupSidebarProps {
  groups: QuestionGroup[]
  selectedSubgroupId: number | null
  onSelect: (subgroup: Subgroup) => void
}

export default function SubgroupSidebar({ groups, selectedSubgroupId, onSelect }: SubgroupSidebarProps) {
  return (
    <aside className="workspace-sidebar">
      {groups.map((group) => (
        <div className="group-block" key={group.group_id}>
          <div className="group-block-head">
            <span className="group-block-index">{group.code.replace('Q', '')}</span>
            <span className="group-block-title">{group.name}</span>
          </div>
          {group.subgroups.map((subgroup) => {
            const status = subgroupStatusOf(subgroup)
            const isActive = subgroup.subgroup_id === selectedSubgroupId
            return (
              <button
                key={subgroup.subgroup_id}
                type="button"
                className={`subgroup-nav-item${isActive ? ' active' : ''}`}
                onClick={() => onSelect(subgroup)}
                title={subgroup.purpose}
              >
                <span className={`subgroup-nav-dot ${status}`} />
                <span className="subgroup-nav-code">{subgroup.code}</span>
                <span className="subgroup-nav-name">{subgroup.name}</span>
                <span className={`subgroup-nav-badge ${status}`}>
                  {subgroup.done_count}/{subgroup.target_count}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
