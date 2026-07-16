import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { ClientStatus, CreateClientInput } from '../types'
import { Select, fieldClass, labelClass } from '../../../components/shared/fields'

type AddClientModalProps = {
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (data: CreateClientInput) => void
}

const defaultForm: CreateClientInput = {
  name: '',
  contactEmail: '',
  industry: '',
  status: 'prospect',
}

export function AddClientModal({ isOpen, isSubmitting, errorMessage, onClose, onSubmit }: AddClientModalProps) {
  const [form, setForm] = useState<CreateClientInput>(defaultForm)

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
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] rounded border border-slate-200 bg-white p-5 shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New account</p>
            <h2 className="text-base font-extrabold text-slate-900">Add client</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {errorMessage && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 font-semibold flex-shrink-0">{errorMessage}</p>
        )}

        <form className="mt-4 flex-1 overflow-y-auto pr-1 grid gap-3" onSubmit={handleSubmit}>
          <label className={labelClass}>
            <span className="mb-1 block">Client name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={fieldClass}
              required
            />
          </label>
          <label className={labelClass}>
            <span className="mb-1 block">Contact email</span>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-1 block">Industry</span>
            <input
              value={form.industry}
              onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-1 block">Status</span>
            <Select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ClientStatus }))}
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
            </Select>
          </label>

          <div className="sticky bottom-0 bg-white pt-3 pb-0.5 mt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-50 transition cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
