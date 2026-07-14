import { useMemo } from 'react'
import type { Influencer } from '../types'

type InfluencerStatsProps = {
  influencers: Influencer[]
}

export function InfluencerStats({ influencers }: InfluencerStatsProps) {
  const stats = useMemo(() => {
    const total = influencers.length
    const instagram = influencers.filter((item) => item.platform === 'Instagram').length
    const tikTok = influencers.filter((item) => item.platform === 'TikTok').length
    const totalReach = influencers.reduce((sum, item) => sum + item.followers, 0)
    
    const avgEngagement = total > 0
      ? (influencers.reduce((sum, item) => sum + item.engagementRate, 0) / total).toFixed(1)
      : '0.0'

    const categoryCounts = influencers.reduce<Record<string, number>>((acc, item) => {
      if (item.category) {
        acc[item.category] = (acc[item.category] ?? 0) + 1
      }
      return acc
    }, {})
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'

    return [
      { label: 'Total Creators', value: total.toLocaleString() },
      { label: 'Instagram / TikTok', value: `${instagram} / ${tikTok}` },
      { label: 'Total Reach', value: totalReach.toLocaleString() },
      { label: 'Avg Engagement', value: `${avgEngagement}%` },
      { label: 'Primary Niche', value: topCategory },
    ]
  }, [influencers])

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
          <p className="mt-2 text-xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
