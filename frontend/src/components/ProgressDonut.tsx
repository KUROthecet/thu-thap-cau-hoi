interface ProgressDonutProps {
  percent: number
  value: string
  label: string
  size?: number
}

const STROKE_WIDTH = 9

export default function ProgressDonut({ percent, value, label, size = 108 }: ProgressDonutProps) {
  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="progress-donut" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.19}
          fontWeight={700}
          fill="var(--text-primary)"
        >
          {value}
        </text>
      </svg>
      <div className="progress-donut-label">{label}</div>
    </div>
  )
}
