import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { useInfluencers } from '../influencers/hooks/useInfluencers'
import { useOrganization } from '../organizations/hooks/useOrganization'
import { useAnalyticsRecords, useCreateAnalyticsRecord } from './hooks/useAnalytics'
import { AddAnalyticsRecordModal } from './components/AddAnalyticsRecordModal'
import { formatCurrency } from '../../lib/currency'
import type { CreateAnalyticsInput } from './types'

function AnalyticsPage() {
  const { data: records, isLoading, isError, error } = useAnalyticsRecords()
  const { data: influencers } = useInfluencers()
  const { data: organization } = useOrganization()
  const createRecord = useCreateAnalyticsRecord()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const influencerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const influencer of influencers ?? []) map.set(influencer.id, influencer.fullName)
    return map
  }, [influencers])

  const totals = useMemo(() => {
    const source = records ?? []
    return source.reduce(
      (acc, record) => ({
        impressions: acc.impressions + (record.impressions ?? 0),
        clicks: acc.clicks + (record.clicks ?? 0),
        conversions: acc.conversions + (record.conversions ?? 0),
        revenue: acc.revenue + (record.revenue ?? 0),
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    )
  }, [records])

  const handleSubmit = (data: CreateAnalyticsInput) => {
    createRecord.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    })
  }

  return (
    <PageShell
      title="Analytics"
      description="Performance data logged across every influencer and campaign."
      eyebrow="Measurement"
      action={records ? `${records.length} records` : undefined}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <p className="text-sm text-slate-400">Impressions</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totals.impressions.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <p className="text-sm text-slate-400">Clicks</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totals.clicks.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <p className="text-sm text-slate-400">Conversions</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totals.conversions.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <p className="text-sm text-slate-400">Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totals.revenue, organization?.currency)}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Performance log</h2>
            <p className="text-sm text-slate-400">Every logged record, most recent first.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={16} />
            Log record
          </button>
        </div>

        {isLoading && <p className="mt-6 text-sm text-slate-400">Loading analytics…</p>}
        {isError && (
          <p className="mt-6 text-sm text-red-400">
            Couldn't load analytics{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        )}
        {records && records.length === 0 && (
          <p className="mt-6 text-sm text-slate-400">No analytics logged yet.</p>
        )}

        {records && records.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Influencer</th>
                  <th className="pb-3 pr-4">Impressions</th>
                  <th className="pb-3 pr-4">Clicks</th>
                  <th className="pb-3 pr-4">Conversions</th>
                  <th className="pb-3 pr-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-slate-800/60 text-slate-300">
                    <td className="py-3 pr-4">{record.date}</td>
                    <td className="py-3 pr-4 font-medium text-white">
                      {influencerNameById.get(record.influencerId) ?? record.influencerId}
                    </td>
                    <td className="py-3 pr-4">{(record.impressions ?? 0).toLocaleString()}</td>
                    <td className="py-3 pr-4">{(record.clicks ?? 0).toLocaleString()}</td>
                    <td className="py-3 pr-4">{(record.conversions ?? 0).toLocaleString()}</td>
                    <td className="py-3 pr-4">{formatCurrency(record.revenue, organization?.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddAnalyticsRecordModal
        isOpen={isModalOpen}
        isSubmitting={createRecord.isPending}
        errorMessage={createRecord.error instanceof Error ? createRecord.error.message : null}
        influencers={influencers ?? []}
        currency={organization?.currency ?? 'USD'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </PageShell>
  )
}

export default AnalyticsPage
