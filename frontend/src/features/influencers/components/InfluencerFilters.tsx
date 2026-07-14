import type { Platform, PipelineStatus } from '../types'
import { Select, labelClass } from '../../../components/shared/fields'

export type VerifiedFilter = 'All' | 'Verified only'
export type BrandSafeFilter = 'All' | 'Brand Safe only'
export type ContactFilter = 'All' | 'Has email' | 'Has phone' | 'Has both'
export type FollowersFilter = 'All' | 'Micro (<50k)' | 'Mid (50k-200k)' | 'Macro (200k-1M)' | 'Mega (>1M)'
export type EngagementFilter = 'All' | 'High (>5%)' | 'Medium (>2%)'

type InfluencerFiltersProps = {
  platform: 'All' | Platform
  category: string
  followers: FollowersFilter
  engagement: EngagementFilter
  verified: VerifiedFilter
  brandSafe: BrandSafeFilter
  contact: ContactFilter
  pipelineStatus: 'All' | PipelineStatus
  onPlatformChange: (val: 'All' | Platform) => void
  onCategoryChange: (val: string) => void
  onFollowersChange: (val: FollowersFilter) => void
  onEngagementChange: (val: EngagementFilter) => void
  onVerifiedChange: (val: VerifiedFilter) => void
  onBrandSafeChange: (val: BrandSafeFilter) => void
  onContactChange: (val: ContactFilter) => void
  onPipelineStatusChange: (val: 'All' | PipelineStatus) => void
}

export function InfluencerFilters({
  platform,
  category,
  followers,
  engagement,
  verified,
  brandSafe,
  contact,
  pipelineStatus,
  onPlatformChange,
  onCategoryChange,
  onFollowersChange,
  onEngagementChange,
  onVerifiedChange,
  onBrandSafeChange,
  onContactChange,
  onPipelineStatusChange,
}: InfluencerFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Platform</span>
        <Select value={platform} onChange={(e) => onPlatformChange(e.target.value as 'All' | Platform)}>
          <option value="All">All Platforms</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Category</span>
        <Select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Fashion">Fashion</option>
          <option value="Beauty">Beauty</option>
          <option value="Gaming">Gaming</option>
          <option value="Fitness">Fitness</option>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
          <option value="Lifestyle">Lifestyle</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Followers</span>
        <Select value={followers} onChange={(e) => onFollowersChange(e.target.value as FollowersFilter)}>
          <option value="All">All Sizes</option>
          <option value="Micro (<50k)">Micro (&lt;50k)</option>
          <option value="Mid (50k-200k)">Mid (50k-200k)</option>
          <option value="Macro (200k-1M)">Macro (200k-1M)</option>
          <option value="Mega (>1M)">Mega (&gt;1M)</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Engagement</span>
        <Select value={engagement} onChange={(e) => onEngagementChange(e.target.value as EngagementFilter)}>
          <option value="All">All Rates</option>
          <option value="High (>5%)">High (&gt;5%)</option>
          <option value="Medium (>2%)">Medium (&gt;2%)</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Verification</span>
        <Select value={verified} onChange={(e) => onVerifiedChange(e.target.value as VerifiedFilter)}>
          <option value="All">All Creators</option>
          <option value="Verified only">Verified only</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Brand Safety</span>
        <Select value={brandSafe} onChange={(e) => onBrandSafeChange(e.target.value as BrandSafeFilter)}>
          <option value="All">All Safety</option>
          <option value="Brand Safe only">Brand Safe only</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Contact</span>
        <Select value={contact} onChange={(e) => onContactChange(e.target.value as ContactFilter)}>
          <option value="All">All Contact info</option>
          <option value="Has email">Has email</option>
          <option value="Has phone">Has phone</option>
          <option value="Has both">Has both</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-1.5 block text-xs font-semibold text-slate-400">Pipeline Status</span>
        <Select value={pipelineStatus} onChange={(e) => onPipelineStatusChange(e.target.value as 'All' | PipelineStatus)}>
          <option value="All">All Pipeline Stages</option>
          <option value="New">New</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Contacted">Contacted</option>
          <option value="Replied">Replied</option>
          <option value="Negotiating">Negotiating</option>
          <option value="Booked">Booked</option>
          <option value="Completed">Completed</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </label>
    </div>
  )
}
