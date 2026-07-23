import { useState, useMemo } from 'react'
import StatCard from '../../components/shared/StatCard'
import { useAuthUser } from '../auth/hooks/useAuth'
import { useOrganization } from '../organizations/hooks/useOrganization'
import { useDashboardSummary } from './hooks/useDashboardSummary'
import { formatCurrency } from '../../lib/currency'
import styles from './DashboardPage.module.css'
import { Users, Building2, Megaphone, UserCheck, Shield } from 'lucide-react'

type ManagerFilter = 'all' | 'me' | 'others'

function DashboardPage() {
  const { data: user } = useAuthUser()
  const { data: organization } = useOrganization()
  const { data: summary, isLoading } = useDashboardSummary()
  const [managerFilter, setManagerFilter] = useState<ManagerFilter>('all')

  const activeCampaigns = summary?.campaigns.active ?? 0
  const newClients = summary?.clients.newProspects ?? 0
  const topCampaigns = summary?.campaigns.top ?? []

  const firstName = user?.name?.split(' ')[0]

  // Filter influencers by creator/manager status
  const filteredInfluencers = useMemo(() => {
    const influencers = summary?.influencers.top ?? []
    if (managerFilter === 'all') return influencers
    if (managerFilter === 'me') {
      return influencers.filter((i) => i.createdByName === 'You' || i.createdBy === user?.id)
    }
    return influencers.filter((i) => i.createdByName !== 'You' && i.createdBy !== user?.id)
  }, [summary?.influencers.top, managerFilter, user])

  // Filter clients/brands by creator/manager status
  const filteredClients = useMemo(() => {
    const clients = summary?.clients.top ?? []
    if (managerFilter === 'all') return clients
    if (managerFilter === 'me') {
      return clients.filter((c) => c.createdByName === 'You' || c.createdBy === user?.id)
    }
    return clients.filter((c) => c.createdByName !== 'You' && c.createdBy !== user?.id)
  }, [summary?.clients.top, managerFilter, user])

  const stats = [
    {
      title: 'Influencers',
      value: isLoading ? '—' : (summary?.influencers.total ?? 0).toLocaleString(),
      detail: isLoading ? 'Loading…' : `${summary?.influencers.total ?? 0} in your roster`,
      accent: 'violet' as const,
    },
    {
      title: 'Campaigns',
      value: isLoading ? '—' : (summary?.campaigns.total ?? 0).toLocaleString(),
      detail: isLoading ? 'Loading…' : `${activeCampaigns} active now`,
      accent: 'cyan' as const,
    },
    {
      title: 'Clients / Brands',
      value: isLoading ? '—' : (summary?.clients.total ?? 0).toLocaleString(),
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
              ? `Keep every creator relationship, client account, and campaign milestone at ${organization.name} in one workspace.`
              : 'Keep every creator relationship, client account, and campaign milestone in one workspace.'}
          </p>
        </div>
        <div className={styles.heroBadge}>Live insights</div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Global Manager/Ownership Filter Bar */}
      <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 p-2.5 rounded gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-800">Team Management View:</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
          <button
            type="button"
            onClick={() => setManagerFilter('all')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              managerFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            All Accounts
          </button>
          <button
            type="button"
            onClick={() => setManagerFilter('me')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              managerFilter === 'me'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Managed by Me
          </button>
          <button
            type="button"
            onClick={() => setManagerFilter('others')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              managerFilter === 'others'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <UserCheck size={12} />
            <span>Managed / Created by Others</span>
          </button>
        </div>
      </div>

      {/* Three-section dashboard grid for Influencers, Clients/Brands, and Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top Influencers & Creator Roster */}
        <div className="border border-slate-200 bg-white p-4 rounded shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-violet-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Influencers Roster</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                {filteredInfluencers.length} Listed
              </span>
            </div>

            {isLoading ? (
              <p className="text-xs text-slate-400 py-4">Loading creators...</p>
            ) : filteredInfluencers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-1.5 font-bold">Creator</th>
                      <th className="py-1.5 font-bold text-right">Stage</th>
                      <th className="py-1.5 font-bold text-right">Managed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {filteredInfluencers.map((creator) => (
                      <tr key={creator.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2">
                          <div className="truncate max-w-[130px] font-bold text-slate-900">
                            {creator.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            @{creator.username} • {creator.followers >= 1000000
                              ? `${(creator.followers / 1000000).toFixed(1)}M`
                              : creator.followers >= 1000
                              ? `${(creator.followers / 1000).toFixed(0)}k`
                              : creator.followers}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                            {creator.pipelineStatus}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            creator.createdByName === 'You'
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {creator.createdByName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No creators match manager filter.</p>
            )}
          </div>
        </div>

        {/* Clients / Brands / Advertisers Overview */}
        <div className="border border-slate-200 bg-white p-4 rounded shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Building2 size={14} className="text-amber-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Clients &amp; Brands</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                {filteredClients.length} Listed
              </span>
            </div>

            {isLoading ? (
              <p className="text-xs text-slate-400 py-4">Loading clients &amp; brands...</p>
            ) : filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-1.5 font-bold">Client / Brand</th>
                      <th className="py-1.5 font-bold text-right">Status</th>
                      <th className="py-1.5 font-bold text-right">Managed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2">
                          <div className="truncate max-w-[130px] font-bold text-slate-900">
                            {client.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            {client.industry || 'General Industry'}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            client.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            client.createdByName === 'You'
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {client.createdByName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No clients or brands match manager filter.</p>
            )}
          </div>
        </div>

        {/* Active Campaigns Overview */}
        <div className="border border-slate-200 bg-white p-4 rounded shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Megaphone size={14} className="text-cyan-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Campaigns</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                Total: {summary?.campaigns.total ?? 0}
              </span>
            </div>

            {isLoading ? (
              <p className="text-xs text-slate-400 py-4">Loading active campaigns...</p>
            ) : topCampaigns.length > 0 ? (
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
                    {topCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2 font-bold text-slate-900 truncate max-w-[140px]">
                          {campaign.name}
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-800">
                          {formatCurrency(campaign.budget, organization?.currency)}
                        </td>
                        <td className="py-2 text-right">
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
              <p className="text-xs text-slate-400 py-6 text-center">No active campaigns found.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
