import type { Platform } from '../types'
import { Select, labelClass } from '../../../components/shared/fields'

export type VerifiedFilter = 'All' | 'Verified only'
export type EmailFilter = 'All' | 'Has email'

type InfluencerFiltersProps = {
  platform: 'All' | Platform
  category: string
  sort: 'followers-desc' | 'followers-asc'
  verified: VerifiedFilter
  hasEmail: EmailFilter
  onPlatformChange: (value: 'All' | Platform) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: 'followers-desc' | 'followers-asc') => void
  onVerifiedChange: (value: VerifiedFilter) => void
  onHasEmailChange: (value: EmailFilter) => void
}

export function InfluencerFilters({
  platform,
  category,
  sort,
  verified,
  hasEmail,
  onPlatformChange,
  onCategoryChange,
  onSortChange,
  onVerifiedChange,
  onHasEmailChange,
}: InfluencerFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <label className={labelClass}>
        <span className="mb-2 block">Platform</span>
        <Select value={platform} onChange={(event) => onPlatformChange(event.target.value as 'All' | Platform)}>
          <option value="All">All</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-2 block">Category</span>
        <Select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="All">All</option>
          <option value="Fashion">Fashion</option>
          <option value="Beauty">Beauty</option>
          <option value="Gaming">Gaming</option>
          <option value="Fitness">Fitness</option>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
          <option value="Education">Education</option>
          <option value="Comedy">Comedy</option>
          <option value="Lifestyle">Lifestyle</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-2 block">Verification</span>
        <Select value={verified} onChange={(event) => onVerifiedChange(event.target.value as VerifiedFilter)}>
          <option value="All">All</option>
          <option value="Verified only">Verified only</option>
        </Select>
      </label>

      <label className={labelClass}>
        <span className="mb-2 block">Contact</span>
        <Select value={hasEmail} onChange={(event) => onHasEmailChange(event.target.value as EmailFilter)}>
          <option value="All">All</option>
          <option value="Has email">Has email</option>
        </Select>
      </label>

      <label className={`${labelClass} sm:col-span-2 lg:col-span-1 xl:col-span-2`}>
        <span className="mb-2 block">Sort by followers</span>
        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as 'followers-desc' | 'followers-asc')}
        >
          <option value="followers-desc">Highest first</option>
          <option value="followers-asc">Lowest first</option>
        </Select>
      </label>
    </div>
  )
}
