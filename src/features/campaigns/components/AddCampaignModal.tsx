import { useState } from 'react'
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

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim() || !form.clientId) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">New campaign</p>
            <h2 className="text-xl font-semibold text-white">Add campaign</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 p-2 text-slate-300">
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{errorMessage}</p>
        )}

        {clients.length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">
            You need at least one client before creating a campaign. Add a client first.
          </p>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className={labelClass}>
              <span className="mb-2 block">Client</span>
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
              <span className="mb-2 block">Campaign name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className={fieldClass}
                required
              />
            </label>
            <label className={labelClass}>
              <span className="mb-2 block">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className={textAreaClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>
                <span className="mb-2 block">Start date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">End date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>
                <span className="mb-2 block">Budget ({currency})</span>
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
                <span className="mb-2 block">Status</span>
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

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
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
