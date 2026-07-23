import { Lightbulb } from 'lucide-react'
import type { Subgroup } from '../../lib/types'

const ROLE_LABELS: Record<string, string> = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  caregiver: 'Người chăm sóc',
}

interface GuideBoxProps {
  subgroup: Subgroup
  onUseExample: (query: string) => void
}

export default function GuideBox({ subgroup, onUseExample }: GuideBoxProps) {
  return (
    <div className="guide-box">
      <Lightbulb size={18} className="guide-box-icon" />
      <div className="guide-box-body">
        <div className="guide-box-purpose">{subgroup.purpose}</div>
        {(subgroup.typical_role || subgroup.expected_retrieval) && (
          <div className="guide-box-meta">
            {subgroup.typical_role && <div>Đối tượng hỏi: {subgroup.typical_role}</div>}
            {subgroup.expected_retrieval && <div>Kỳ vọng truy xuất: {subgroup.expected_retrieval}</div>}
          </div>
        )}
        {subgroup.examples.length > 0 && (
          <div className="guide-box-examples">
            {subgroup.examples.map((example, index) => (
              <div className="guide-example" key={index}>
                <span className="guide-example-role">{ROLE_LABELS[example.role] ?? example.role}</span>
                <span className="guide-example-text">"{example.query}"</span>
                <button
                  type="button"
                  className="guide-example-use"
                  onClick={() => onUseExample(example.query)}
                >
                  Dùng câu này ↵
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
