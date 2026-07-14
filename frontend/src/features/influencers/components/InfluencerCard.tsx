import { Link } from 'react-router-dom'
import { BadgeCheck, ShieldCheck, Mail, Phone, Trash2, ExternalLink, Eye, Camera, Video, MessageSquare } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { PipelineStatusBadge } from './PipelineStatusSelect'
import type { Influencer } from '../types'

type InfluencerCardProps = {
  influencer: Influencer
  onOpenDrawer: (id: string) => void
  onDelete: (id: string) => void
}

export function InfluencerCard({ influencer, onOpenDrawer, onDelete }: InfluencerCardProps) {
  // Format numbers to short strings (e.g., 1.2M, 54.3K)
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    }
    return num.toString()
  }

  // Set platform specific accents
  const getPlatformColors = () => {
    switch (influencer.platform) {
      case 'Instagram':
        return {
          border: 'hover:border-pink-500/30',
          ring: 'ring-pink-500/20 group-hover:ring-pink-500/40',
          badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
          icon: Camera,
        }
      case 'TikTok':
        return {
          border: 'hover:border-cyan-500/30',
          ring: 'ring-cyan-500/20 group-hover:ring-cyan-500/40',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: MessageSquare,
        }
      case 'YouTube':
        return {
          border: 'hover:border-rose-500/30',
          ring: 'ring-rose-500/20 group-hover:ring-rose-500/40',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: Video,
        }
      default:
        return {
          border: 'hover:border-slate-700',
          ring: 'ring-slate-800',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Camera,
        }
    }
  }

  const pColors = getPlatformColors()
  const PlatformIcon = pColors.icon

  return (
    <article className={`group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg hover:shadow-slate-950/50 hover:bg-slate-900/40 transition duration-200 flex flex-col justify-between gap-4 relative min-h-[340px] ${pColors.border}`}>
      
      {/* Platform & Outreach badge indicators */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${pColors.badge}`}>
          <PlatformIcon size={10} />
          {influencer.platform}
        </span>
        <PipelineStatusBadge status={influencer.pipelineStatus} />
      </div>

      {/* Main card header */}
      <div className="flex items-start gap-3 mt-1">
        <div className="relative flex-shrink-0">
          <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={48} />
          <div className={`absolute -inset-1 rounded-full ring-2 ${pColors.ring} transition-all duration-200 -z-10`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
              {influencer.fullName}
            </h3>
            {influencer.verified && (
              <BadgeCheck size={14} className="text-cyan-400 flex-shrink-0" title="Verified Creator" />
            )}
            {influencer.brandSafe && (
              <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" title="Brand Safe" />
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">@{influencer.username}</p>
          <span className="inline-block mt-1 text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-400 rounded-md font-semibold">
            {influencer.category}
          </span>
        </div>
      </div>

      {/* Bio snippet */}
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px] italic">
        {influencer.bio || 'No bio on file.'}
      </p>

      {/* Structured metrics grid */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5">
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Followers</p>
          <p className="text-xs font-semibold text-white">{formatNumber(influencer.followers)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Engagement</p>
          <p className={`text-xs font-semibold ${influencer.engagementRate > 4.5 ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {influencer.engagementRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Avg Views</p>
          <p className="text-xs font-semibold text-white">{formatNumber(influencer.averageViews)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Post Price</p>
          <p className="text-xs font-semibold text-emerald-400">${influencer.pricePost || 'N/A'}</p>
        </div>
      </div>

      {/* Quick Contact & Action Bars */}
      <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-auto">
        <div className="flex items-center gap-1.5">
          {influencer.email ? (
            <a
              href={`mailto:${influencer.email}`}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-900 transition"
              title={influencer.email}
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={12} />
            </a>
          ) : null}
          {influencer.phone ? (
            <a
              href={`tel:${influencer.phone}`}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-900 transition"
              title={influencer.phone}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={12} />
            </a>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick inspect button */}
          <button
            type="button"
            onClick={() => onOpenDrawer(influencer.id)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition"
            title="Inspect Details"
          >
            <Eye size={12} />
          </button>

          {/* Full Page profile link */}
          <Link
            to={`/influencers/${influencer.id}`}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition"
            title="View Full Profile"
          >
            <ExternalLink size={12} />
          </Link>

          {/* Delete quick action */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Remove ${influencer.fullName}?`)) {
                onDelete(influencer.id)
              }
            }}
            className="p-1.5 rounded-lg border border-slate-800/80 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition"
            title="Delete Creator"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

    </article>
  )
}
