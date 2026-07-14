import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Influencer } from '../../influencers/types'
import type { CreateAnalyticsInput } from '../types'
import { Select, fieldClass, labelClass } from '../../../components/shared/fields'

type AddAnalyticsRecordModalProps = {
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  influencers: Influencer[]
  currency: string
  onClose: () => void
  onSubmit: (data: CreateAnalyticsInput) => void
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  influencerId: '',
  date: todayIso(),
  impressions: '',
  clicks: '',
  conversions: '',
  revenue: '',
}

export function AddAnalyticsRecordModal({
  isOpen,
  isSubmitting,
  errorMessage,
  influencers,
  currency,
  onClose,
  onSubmit,
}: AddAnalyticsRecordModalProps) {
  const [form, setForm] = useState(emptyForm)

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.influencerId || !form.date) return
    onSubmit({
      influencerId: form.influencerId,
      date: form.date,
      impressions: form.impressions ? Number(form.impressions) : undefined,
      clicks: form.clicks ? Number(form.clicks) : undefined,
      conversions: form.conversions ? Number(form.conversions) : undefined,
      revenue: form.revenue ? Number(form.revenue) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">New record</p>
            <h2 className="text-xl font-semibold text-white">Log analytics</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 p-2 text-slate-300">
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{errorMessage}</p>
        )}

        {influencers.length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">Add an influencer first before logging analytics.</p>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className={labelClass}>
              <span className="mb-2 block">Influencer</span>
              <Select
                value={form.influencerId}
                onChange={(event) => setForm((current) => ({ ...current, influencerId: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select an influencer
                </option>
                {influencers.map((influencer) => (
                  <option key={influencer.id} value={influencer.id}>
                    {influencer.fullName}
                  </option>
                ))}
              </Select>
            </label>
            <label className={labelClass}>
              <span className="mb-2 block">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className={fieldClass}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>
                <span className="mb-2 block">Impressions</span>
                <input
                  type="number"
                  min="0"
                  value={form.impressions}
                  onChange={(event) => setForm((current) => ({ ...current, impressions: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">Clicks</span>
                <input
                  type="number"
                  min="0"
                  value={form.clicks}
                  onChange={(event) => setForm((current) => ({ ...current, clicks: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">Conversions</span>
                <input
                  type="number"
                  min="0"
                  value={form.conversions}
                  onChange={(event) => setForm((current) => ({ ...current, conversions: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">Revenue ({currency})</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.revenue}
                  onChange={(event) => setForm((current) => ({ ...current, revenue: event.target.value }))}
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : 'Save record'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
