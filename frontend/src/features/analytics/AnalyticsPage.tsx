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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impressions</p>
          <p className="mt-1 text-base font-extrabold text-slate-900">{totals.impressions.toLocaleString()}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clicks</p>
          <p className="mt-1 text-base font-extrabold text-slate-900">{totals.clicks.toLocaleString()}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversions</p>
          <p className="mt-1 text-base font-extrabold text-slate-900">{totals.conversions.toLocaleString()}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue</p>
          <p className="mt-1 text-base font-extrabold text-slate-900">{formatCurrency(totals.revenue, organization?.currency)}</p>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Performance log</h2>
            <p className="text-xs text-slate-500">Every logged record, most recent first.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            <Plus size={14} />
            Log record
          </button>
        </div>

        {isLoading && <p className="mt-4 text-xs text-slate-500">Loading analytics…</p>}
        {isError && (
          <p className="mt-4 text-xs text-red-600">
            Couldn't load analytics{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        )}
        {records && records.length === 0 && (
          <p className="mt-4 text-xs text-slate-500">No analytics logged yet.</p>
        )}

        {records && records.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-2 pr-4 font-bold">Date</th>
                  <th className="pb-2 pr-4 font-bold">Influencer</th>
                  <th className="pb-2 pr-4 font-bold">Impressions</th>
                  <th className="pb-2 pr-4 font-bold">Clicks</th>
                  <th className="pb-2 pr-4 font-bold">Conversions</th>
                  <th className="pb-2 pr-4 font-bold">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-4">{record.date}</td>
                    <td className="py-2.5 pr-4 font-bold text-slate-900">
                      {influencerNameById.get(record.influencerId) ?? record.influencerId}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{(record.impressions ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-medium">{(record.clicks ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-medium">{(record.conversions ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-bold text-slate-800">{formatCurrency(record.revenue, organization?.currency)}</td>
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
