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
        color: 'bg-slate-50 text-slate-700',
      },
      {
        label: 'Instagram Ratio',
        value: `${igCount} / ${total}`,
        sub: `${((igCount / (total || 1)) * 100).toFixed(0)}% of database`,
        icon: Camera,
        color: 'bg-pink-50 text-pink-700',
      },
      {
        label: 'TikTok / YouTube',
        value: `${ttCount} / ${ytCount}`,
        sub: 'Cross-platform content',
        icon: Video,
        color: 'bg-rose-50 text-rose-700',
      },
      {
        label: 'Avg Engagement',
        value: `${avgEngagement}%`,
        sub: 'Consistent performance',
        icon: Percent,
        color: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Avg Reach (Followers)',
        value: avgFollowers.toLocaleString(),
        sub: 'Individual creator reach',
        icon: BarChart3,
        color: 'bg-purple-50 text-purple-700',
      },
      {
        label: 'New This Week',
        value: `+${newThisWeek}`,
        sub: 'Creator velocity',
        icon: CalendarDays,
        color: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Contacted Stage',
        value: contactedCount.toLocaleString(),
        sub: 'Awaiting replies',
        icon: Send,
        color: 'bg-sky-50 text-sky-700',
      },
      {
        label: 'Booked / Campaigns',
        value: bookedCount.toLocaleString(),
        sub: `${activeCampaigns} campaigns active`,
        icon: Bookmark,
        color: 'bg-indigo-50 text-indigo-700',
      },
    ]
  }, [influencers])

  return (
    <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="rounded border border-slate-200 bg-white p-2 shadow-2xs transition-all duration-150 hover:border-slate-300 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-tight">
                {stat.label}
              </span>
              <div className={`p-0.5 rounded ${stat.color} shrink-0`}>
                <Icon size={10} />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-sm font-bold text-slate-900 tracking-tight leading-none">{stat.value}</div>
              <div className="mt-0.5 text-[8.5px] font-semibold text-slate-400 leading-tight">
                {stat.sub}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
