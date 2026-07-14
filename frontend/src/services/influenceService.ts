import type { Campaign, Client, Influencer, Organization } from '../db/models'

export type InfluenceService = {
  getOrganizations: () => Promise<Organization[]>
  getInfluencers: () => Promise<Influencer[]>
  getCampaigns: () => Promise<Campaign[]>
  getClients: () => Promise<Client[]>
}

export const influenceService: InfluenceService = {
  getOrganizations: async () => [],
  getInfluencers: async () => [],
  getCampaigns: async () => [],
  getClients: async () => [],
}
