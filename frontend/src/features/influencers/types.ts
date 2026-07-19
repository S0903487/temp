export type Platform = 'Instagram' | 'TikTok' | 'YouTube'

export type InfluencerStatus = 'Active' | 'Review' | 'Paused' | 'Booked'

/** Outreach workflow stage — separate from `status`, which tracks account health. */
export type PipelineStatus =
  | 'New'
  | 'Reviewed'
  | 'Contacted'
  | 'Replied'
  | 'Negotiating'
  | 'Booked'
  | 'Completed'
  | 'Inactive'

export const PIPELINE_STATUSES: PipelineStatus[] = [
  'New',
  'Reviewed',
  'Contacted',
  'Replied',
  'Negotiating',
  'Booked',
  'Completed',
  'Inactive',
]

export type Influencer = {
  id: string
  organizationId?: string
  fullName: string
  username: string
  platform: Platform
  category: string
  country: string
  language: string
  followers: number
  following: number
  totalPosts: number
  engagementRate: number
  averageViews: number
  averageLikes: number
  averageComments: number
  email: string
  phone: string
  pricePost: number
  priceStory: number
  verified: boolean
  brandSafe: boolean
  status: InfluencerStatus
  pipelineStatus: PipelineStatus
  notes: string
  tags: string[]
  bio: string
  profileImage: string | null
  profileLink?: string
  roi?: number
  cpa?: number
  cpi?: number
  ltv?: number
}

export type Tag = {
  id: string
  name: string
}

export type InfluencerNote = {
  id: string
  body: string
  authorId: string | null
  createdAt: string
}

export type InfluencerSnapshot = {
  id: string
  date: string
  followers: number
  averageViews: number
  averageLikes: number
  averageComments: number
  engagementRate: number
}

export type InfluencerCampaignHistoryItem = {
  campaignId: string
  name: string
  clientName: string
  status: string
  startDate: string | null
  endDate: string | null
  budget: number | null
  addedAt: string
}
