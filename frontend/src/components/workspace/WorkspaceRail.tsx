import ProgressDonut from '../ProgressDonut'
import { subgroupStatusOf } from '../../lib/subgroupStatus'
import type { QuestionGroup, Subgroup } from '../../lib/types'

interface WorkspaceRailProps {
  groups: QuestionGroup[]
  selectedSubgroupId: number | null
  onJump: (subgroup: Subgroup) => void
}

export default function WorkspaceRail({ groups, selectedSubgroupId, onJump }: WorkspaceRailProps) {
  const subgroups = groups.flatMap((group) => group.subgroups)
  const typesDone = subgroups.filter((sg) => sg.done_count >= sg.target_count).length
  const typesTotal = subgroups.length
  const entriesDone = subgroups.reduce((sum, sg) => sum + Math.min(sg.done_count, sg.target_count), 0)
  const entriesTotal = subgroups.reduce((sum, sg) => sum + sg.target_count, 0)

  return (
    <aside className="workspace-rail">
      <div>
        <div className="rail-card-title">Tiến độ 24 loại câu hỏi</div>
        <p className="rail-explainer">
          Có <b>24 loại câu hỏi</b> (Q1.1 → Q6.4). Mỗi loại cần đúng <b>5 câu</b> khác nhau, tổng
          cộng <b>24 × 5 = 120 câu</b>. Bấm vào một ô số bên dưới để chuyển sang loại đó.
        </p>
        {groups.map((group) => (
          <div className="rail-minimap-row" key={group.group_id}>
            <span className="rail-minimap-label">{group.code}</span>
            <div className="rail-minimap-cells">
              {group.subgroups.map((subgroup) => {
                const status = subgroupStatusOf(subgroup)
                const isActive = subgroup.subgroup_id === selectedSubgroupId
                return (
                  <button
                    key={subgroup.subgroup_id}
                    type="button"
                    className={`rail-minimap-cell ${status}${isActive ? ' active' : ''}`}
                    title={`${subgroup.code} · ${subgroup.name} (${subgroup.done_count}/${subgroup.target_count} câu)`}
                    onClick={() => onJump(subgroup)}
                  >
                    {subgroup.order_index}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rail-donut-row">
        <ProgressDonut
          percent={typesTotal > 0 ? (typesDone / typesTotal) * 100 : 0}
          value={`${typesDone}/${typesTotal}`}
          label="Loại đã đủ 5/5"
        />
        <ProgressDonut
          percent={entriesTotal > 0 ? (entriesDone / entriesTotal) * 100 : 0}
          value={`${entriesDone}/${entriesTotal}`}
          label="Tổng số câu"
        />
      </div>
    </aside>
  )
}
