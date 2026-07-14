import type { InfluencerCampaignHistoryItem } from '../types'

type CampaignHistoryListProps = {
  items: InfluencerCampaignHistoryItem[]
  isLoading?: boolean
}

function formatMoney(value: number | null) {
  if (value == null) return '—'
  return `$${value.toLocaleString()}`
}

export function CampaignHistoryList({ items, isLoading }: CampaignHistoryListProps) {
  if (isLoading) return <p className="text-sm text-slate-500">Loading campaign history…</p>
  if (items.length === 0) return <p className="text-sm text-slate-500">No campaigns yet for this creator.</p>

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-900/90 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Brand</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Budget</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {items.map((item) => (
            <tr key={item.campaignId} className="hover:bg-slate-800/70">
              <td className="px-4 py-3 font-medium text-white">{item.name}</td>
              <td className="px-4 py-3">{item.clientName}</td>
              <td className="px-4 py-3 text-slate-400">
                {item.startDate ?? '—'} → {item.endDate ?? '—'}
              </td>
              <td className="px-4 py-3">{formatMoney(item.budget)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs capitalize text-slate-300">
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
