import { useMemo } from 'react'
import { Users, Camera, Video, Percent, BarChart3, CalendarDays, Bookmark, Send } from 'lucide-react'
import type { Influencer } from '../types'

type InfluencerStatsGridProps = {
  influencers: Influencer[]
}

export function InfluencerStatsGrid({ influencers }: InfluencerStatsGridProps) {
  const stats = useMemo(() => {
    const total = influencers.length
    const igCount = influencers.filter((i) => i.platform === 'Instagram').length
    const ttCount = influencers.filter((i) => i.platform === 'TikTok').length
    const ytCount = influencers.filter((i) => i.platform === 'YouTube').length

    const avgFollowers = total > 0
      ? Math.round(influencers.reduce((acc, i) => acc + i.followers, 0) / total)
      : 0

    const avgEngagement = total > 0
      ? (influencers.reduce((acc, i) => acc + i.engagementRate, 0) / total).toFixed(1)
      : '0.0'

    const contactedCount = influencers.filter((i) => i.pipelineStatus === 'Contacted').length
    const bookedCount = influencers.filter((i) => i.pipelineStatus === 'Booked').length

    // Calculate "New this week" - within 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const newThisWeek = influencers.filter((i) => {
      if (!i.createdAt) return false
      return new Date(i.createdAt) >= sevenDaysAgo
    }).length

    // Active campaigns (where status is Booked or currently has running campaign historical references)
    const activeCampaigns = influencers.filter((i) => i.status === 'Booked' || i.pipelineStatus === 'Booked').length

    return [
      {
        label: 'Total Creators',
        value: total.toLocaleString(),
        sub: 'Live directory',
        icon: Users,
        color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
      },
      {
        label: 'Instagram Ratio',
        value: `${igCount} / ${total}`,
        sub: `${((igCount / (total || 1)) * 100).toFixed(0)}% of database`,
        icon: Camera,
        color: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
      },
      {
        label: 'TikTok / YouTube',
        value: `${ttCount} / ${ytCount}`,
        sub: 'Cross-platform content',
        icon: Video,
        color: 'text-red-400 border-red-500/20 bg-red-500/5',
      },
      {
        label: 'Avg Engagement',
        value: `${avgEngagement}%`,
        sub: 'Consistent performance',
        icon: Percent,
        color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      },
      {
        label: 'Avg Reach (Followers)',
        value: avgFollowers.toLocaleString(),
        sub: 'Individual creator reach',
        icon: BarChart3,
        color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
      },
      {
        label: 'New This Week',
        value: `+${newThisWeek}`,
        sub: 'Creator velocity',
        icon: CalendarDays,
        color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      },
      {
        label: 'Contacted Stage',
        value: contactedCount.toLocaleString(),
        sub: 'Awaiting replies',
        icon: Send,
        color: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
      },
      {
        label: 'Booked / Campaigns',
        value: bookedCount.toLocaleString(),
        sub: `${activeCampaigns} campaigns active`,
        icon: Bookmark,
        color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
      },
    ]
  }, [influencers])

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:border-slate-700 hover:shadow-slate-950/20 ${stat.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <Icon size={14} className="opacity-80" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-500">{stat.sub}</p>
          </div>
        )
      })}
    </div>
  )
}
