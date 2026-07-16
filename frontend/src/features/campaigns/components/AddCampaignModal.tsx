import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Client } from '../../clients/types'
import type { CampaignStatus, CreateCampaignInput } from '../types'
import { Select, fieldClass, textAreaClass, labelClass } from '../../../components/shared/fields'

type AddCampaignModalProps = {
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  clients: Client[]
  currency: string
  onClose: () => void
  onSubmit: (data: CreateCampaignInput) => void
}

const emptyForm: CreateCampaignInput = {
  clientId: '',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: undefined,
  status: 'draft',
}

export function AddCampaignModal({ isOpen, isSubmitting, errorMessage, clients, currency, onClose, onSubmit }: AddCampaignModalProps) {
  const [form, setForm] = useState<CreateCampaignInput>(emptyForm)

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
    if (!form.name.trim() || !form.clientId) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] rounded border border-slate-200 bg-white p-5 shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New campaign</p>
            <h2 className="text-base font-extrabold text-slate-900">Add campaign</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {errorMessage && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 font-semibold flex-shrink-0">{errorMessage}</p>
        )}

        {clients.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500 flex-shrink-0">
            You need at least one client before creating a campaign. Add a client first.
          </p>
        ) : (
          <form className="mt-4 flex-1 overflow-y-auto pr-1 grid gap-3" onSubmit={handleSubmit}>
            <label className={labelClass}>
              <span className="mb-1 block">Client</span>
              <Select
                value={form.clientId}
                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select a client
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className={labelClass}>
              <span className="mb-1 block">Campaign name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className={fieldClass}
                required
              />
            </label>
            <label className={labelClass}>
              <span className="mb-1 block">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className={textAreaClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className="mb-1 block">Start date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">End date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className="mb-1 block">Budget ({currency})</span>
                <input
                  type="number"
                  min="0"
                  value={form.budget ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      budget: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">Status</span>
                <Select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CampaignStatus }))}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
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
                {isSubmitting ? 'Saving…' : 'Save campaign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
