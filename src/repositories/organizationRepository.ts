import type { Organization } from '../db/models'

export const organizationRepository = {
  list: async (): Promise<Organization[]> => {
    return []
  },
}
