import type { Influencer } from '../db/models'

export const influencerRepository = {
  list: async (): Promise<Influencer[]> => {
    return []
  },
}
