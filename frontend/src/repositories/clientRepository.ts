import type { Client } from '../db/models'

export const clientRepository = {
  list: async (): Promise<Client[]> => {
    return []
  },
}
