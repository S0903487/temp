import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { useClients } from '../clients/hooks/useClients'
import { useOrganization } from '../organizations/hooks/useOrganization'
import { useCampaigns, useCreateCampaign } from './hooks/useCampaigns'
import { AddCampaignModal } from './components/AddCampaignModal'
import { formatCurrency } from '../../lib/currency'
import type { CreateCampaignInput } from './types'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  paused: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  completed: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/30',
}

function CampaignsPage() {
  const { data: campaigns, isLoading, isError, error } = useCampaigns()
  const { data: clients } = useClients()
  const { data: organization } = useOrganization()
  const createCampaign = useCreateCampaign()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients ?? []) map.set(client.id, client.name)
    return map
  }, [clients])

  const handleSubmit = (data: CreateCampaignInput) => {
    createCampaign.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    })
  }

  return (
    <PageShell
      title="Campaigns"
      description="Plan, launch, and track every influencer campaign across your clients."
      eyebrow="Operations"
      action={campaigns ? `${campaigns.length} campaigns` : undefined}
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Campaign pipeline</h2>
            <p className="text-sm text-slate-400">Every active and past campaign.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={16} />
            New campaign
          </button>
        </div>

        {isLoading && <p className="mt-6 text-sm text-slate-400">Loading campaigns…</p>}
        {isError && (
          <p className="mt-6 text-sm text-red-400">
            Couldn't load campaigns{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        )}

        {campaigns && campaigns.length === 0 && (
          <p className="mt-6 text-sm text-slate-400">No campaigns yet. Create your first one.</p>
        )}

        {campaigns && campaigns.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Campaign</th>
                  <th className="pb-3 pr-4">Client</th>
                  <th className="pb-3 pr-4">Timeline</th>
                  <th className="pb-3 pr-4">Budget</th>
                  <th className="pb-3 pr-4">Influencers</th>
                  <th className="pb-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-800/60 text-slate-300">
                    <td className="py-3 pr-4 font-medium text-white">{campaign.name}</td>
                    <td className="py-3 pr-4">{clientNameById.get(campaign.clientId) ?? '—'}</td>
                    <td className="py-3 pr-4">
                      {campaign.startDate || '—'} → {campaign.endDate || '—'}
                    </td>
                    <td className="py-3 pr-4">{formatCurrency(campaign.budget, organization?.currency)}</td>
                    <td className="py-3 pr-4">{campaign.influencerIds.length}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[campaign.status] ?? ''}`}>
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCampaignModal
        isOpen={isModalOpen}
        isSubmitting={createCampaign.isPending}
        errorMessage={createCampaign.error instanceof Error ? createCampaign.error.message : null}
        clients={clients ?? []}
        currency={organization?.currency ?? 'USD'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </PageShell>
  )
}

export default CampaignsPage
