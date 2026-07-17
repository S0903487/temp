import StatCard from '../../components/shared/StatCard'
import { useAuthUser } from '../auth/hooks/useAuth'
import { useOrganization } from '../organizations/hooks/useOrganization'
import { useClients } from '../clients/hooks/useClients'
import { useCampaigns } from '../campaigns/hooks/useCampaigns'
import { useInfluencers } from '../influencers/hooks/useInfluencers'
import { formatCurrency } from '../../lib/currency'
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
        <div className={styles.heroBadge}>** Live insights</div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Two-column dense informative layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
        {/* Active Campaigns List */}
        <div className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Campaigns</h2>
            <span className="text-[10px] font-bold text-slate-400">Total: {campaigns?.length ?? 0}</span>
          </div>
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading active campaigns...</p>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-1.5 font-bold">Campaign Name</th>
                    <th className="py-1.5 font-bold text-right">Budget</th>
                    <th className="py-1.5 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 font-bold text-slate-900 truncate max-w-[180px]">
                        {campaign.name}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-slate-800">
                        {formatCurrency(campaign.budget, organization?.currency)}
                      </td>
                      <td className="py-1.5 text-right">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          campaign.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">No campaigns found.</p>
          )}
        </div>

        {/* Top Influencers in Outreach Pipeline */}
        <div className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pipeline Status Overview</h2>
            <span className="text-[10px] font-bold text-slate-400">Active roster: {influencers?.length ?? 0}</span>
          </div>
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading top creators...</p>
          ) : influencers && influencers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-1.5 font-bold">Creator</th>
                    <th className="py-1.5 font-bold text-right">Followers</th>
                    <th className="py-1.5 font-bold text-right">Outreach Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {influencers.slice(0, 5).map((creator) => (
                    <tr key={creator.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5">
                        <div className="truncate max-w-[150px] font-bold text-slate-900">
                          {creator.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400">@{creator.username}</div>
                      </td>
                      <td className="py-1.5 text-right font-semibold text-slate-800">
                        {creator.followers >= 1000000
                          ? `${(creator.followers / 1000000).toFixed(1)}M`
                          : creator.followers >= 1000
                          ? `${(creator.followers / 1000).toFixed(0)}k`
                          : creator.followers}
                      </td>
                      <td className="py-1.5 text-right">
                        <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                          {creator.pipelineStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">No creators in pipeline.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
