import type { Subgroup } from './types'

export type SubgroupStatus = 'done' | 'partial' | 'empty'

export function subgroupStatusOf(subgroup: Subgroup): SubgroupStatus {
  if (subgroup.done_count >= subgroup.target_count) return 'done'
  if (subgroup.done_count > 0) return 'partial'
  return 'empty'
}
