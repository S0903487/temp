import StatCard from '../../components/shared/StatCard'
import { useAuthUser } from '../auth/hooks/useAuth'
import { useOrganization } from '../organizations/hooks/useOrganization'
import { useClients } from '../clients/hooks/useClients'
import { useCampaigns } from '../campaigns/hooks/useCampaigns'
import { useInfluencers } from '../influencers/hooks/useInfluencers'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  const { data: user } = useAuthUser()
  const { data: organization } = useOrganization()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()
  const { data: influencers, isLoading: influencersLoading } = useInfluencers()

  const isLoading = clientsLoading || campaignsLoading || influencersLoading
  const activeCampaigns = campaigns?.filter((campaign) => campaign.status === 'active').length ?? 0
  const newClients = clients?.filter((client) => client.status === 'prospect').length ?? 0

  const firstName = user?.name?.split(' ')[0]

  const stats = [
    {
      title: 'Influencers',
      value: isLoading ? '—' : (influencers?.length ?? 0).toLocaleString(),
      detail: isLoading ? 'Loading…' : `${influencers?.length ?? 0} in your roster`,
      accent: 'violet' as const,
    },
    {
      title: 'Campaigns',
      value: isLoading ? '—' : (campaigns?.length ?? 0).toLocaleString(),
      detail: isLoading ? 'Loading…' : `${activeCampaigns} active now`,
      accent: 'cyan' as const,
    },
    {
      title: 'Clients',
      value: isLoading ? '—' : (clients?.length ?? 0).toLocaleString(),
      detail: isLoading ? 'Loading…' : `${newClients} new prospects`,
      accent: 'amber' as const,
    },
  ]

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Performance overview</p>
          <h1>Welcome back{firstName ? `, ${firstName}` : ''}.</h1>
          <p className={styles.description}>
            {organization?.name
              ? `Keep every creator relationship and campaign milestone at ${organization.name} in one polished workspace.`
              : 'Keep every creator relationship and campaign milestone in one polished workspace.'}
          </p>
        </div>
        <div className={styles.heroBadge}>Live insights</div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
