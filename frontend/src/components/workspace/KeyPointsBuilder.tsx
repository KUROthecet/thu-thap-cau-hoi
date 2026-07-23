import { Plus, X } from 'lucide-react'

interface KeyPointsBuilderProps {
  points: string[]
  onChange: (points: string[]) => void
}

export default function KeyPointsBuilder({ points, onChange }: KeyPointsBuilderProps) {
  function updatePoint(index: number, value: string) {
    const next = points.slice()
    next[index] = value
    onChange(next)
  }

  function addPoint() {
    onChange([...points, ''])
  }

  function removePoint(index: number) {
    onChange(points.filter((_, i) => i !== index))
  }

  return (
    <div>
      {points.map((point, index) => (
        <div className="point-row" key={index}>
          <span className="point-bullet">–</span>
          <input
            type="text"
            className="form-input"
            placeholder="VD: Không chẩn đoán chắc khi thiếu dữ kiện"
            value={point}
            onChange={(event) => updatePoint(index, event.target.value)}
          />
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => removePoint(index)}>
            <X size={13} />
          </button>
        </div>
      ))}
      <button type="button" className="add-dashed-btn" onClick={addPoint}>
        <Plus size={12} /> Thêm ý bắt buộc
      </button>
    </div>
  )
}
