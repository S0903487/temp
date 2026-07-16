import { useState, useEffect } from 'react'
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

  // Freeze body scroll when modal appears
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] rounded border border-slate-200 bg-white p-5 shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New record</p>
            <h2 className="text-base font-extrabold text-slate-900">Log analytics</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {errorMessage && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 font-semibold flex-shrink-0">{errorMessage}</p>
        )}

        {influencers.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500 flex-shrink-0">Add an influencer first before logging analytics.</p>
        ) : (
          <form className="mt-4 flex-1 overflow-y-auto pr-1 grid gap-3" onSubmit={handleSubmit}>
            <label className={labelClass}>
              <span className="mb-1 block">Influencer</span>
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
              <span className="mb-1 block">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className={fieldClass}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className="mb-1 block">Impressions</span>
                <input
                  type="number"
                  min="0"
                  value={form.impressions}
                  onChange={(event) => setForm((current) => ({ ...current, impressions: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">Clicks</span>
                <input
                  type="number"
                  min="0"
                  value={form.clicks}
                  onChange={(event) => setForm((current) => ({ ...current, clicks: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">Conversions</span>
                <input
                  type="number"
                  min="0"
                  value={form.conversions}
                  onChange={(event) => setForm((current) => ({ ...current, conversions: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">Revenue ({currency})</span>
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

            <div className="sticky bottom-0 bg-white pt-3 pb-0.5 mt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
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
