import type { Campaign } from '../db/models'

export const campaignRepository = {
  list: async (): Promise<Campaign[]> => {
    return []
  },
}
