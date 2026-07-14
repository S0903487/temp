export interface Influencer {
  id: string;
  name: string;
  bio?: string;
  profileImageUrl?: string;
  // Relations by ID
  campaignIds: string[]; // Influencer belongs to many campaigns
  analyticsIds: string[]; // Analytics records for this influencer
  createdAt: string;
  updatedAt?: string;
}
