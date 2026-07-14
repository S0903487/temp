import type { InfluencerSnapshot } from '../types'

type GrowthChartProps = {
  snapshots: InfluencerSnapshot[]
  metric?: 'followers' | 'engagementRate'
}

const WIDTH = 560
const HEIGHT = 160
const PADDING = 24

export function GrowthChart({ snapshots, metric = 'followers' }: GrowthChartProps) {
  if (snapshots.length === 0) {
    return <p className="text-sm text-slate-500">No history yet — updates to followers or engagement will appear here.</p>
  }

  const values = snapshots.map((s) => s[metric])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = snapshots.map((snap, index) => {
    const x = PADDING + (index / Math.max(snapshots.length - 1, 1)) * (WIDTH - PADDING * 2)
    const y = HEIGHT - PADDING - ((snap[metric] - min) / range) * (HEIGHT - PADDING * 2)
    return { x, y, snap }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${HEIGHT - PADDING} L ${points[0].x.toFixed(1)} ${HEIGHT - PADDING} Z`

  const latest = snapshots[snapshots.length - 1]
  const first = snapshots[0]
  const delta = latest[metric] - first[metric]
  const deltaLabel =
    metric === 'followers'
      ? `${delta >= 0 ? '+' : ''}${delta.toLocaleString()} followers`
      : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pt engagement`

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-40 w-full">
        <path d={areaPath} fill="url(#growthGradient)" opacity={0.25} />
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#22d3ee" />
        ))}
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <p className={`mt-1 text-xs ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {deltaLabel} since {new Date(first.date).toLocaleDateString()}
      </p>
    </div>
  )
}
