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
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
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
      <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Campaign pipeline</h2>
            <p className="text-xs text-slate-500">Every active and past campaign.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            <Plus size={14} />
            New campaign
          </button>
        </div>

        {isLoading && <p className="mt-4 text-xs text-slate-500">Loading campaigns…</p>}
        {isError && (
          <p className="mt-4 text-xs text-red-600">
            Couldn't load campaigns{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        )}

        {campaigns && campaigns.length === 0 && (
          <p className="mt-4 text-xs text-slate-500">No campaigns yet. Create your first one.</p>
        )}

        {campaigns && campaigns.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-2 pr-4 font-bold">Campaign</th>
                  <th className="pb-2 pr-4 font-bold">Client</th>
                  <th className="pb-2 pr-4 font-bold">Timeline</th>
                  <th className="pb-2 pr-4 font-bold">Budget</th>
                  <th className="pb-2 pr-4 font-bold">Influencers</th>
                  <th className="pb-2 pr-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-4 font-bold text-slate-900">{campaign.name}</td>
                    <td className="py-2.5 pr-4">{clientNameById.get(campaign.clientId) ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      {campaign.startDate || '—'} → {campaign.endDate || '—'}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-800">{formatCurrency(campaign.budget, organization?.currency)}</td>
                    <td className="py-2.5 pr-4">{campaign.influencerIds.length}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[campaign.status] ?? ''}`}>
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
