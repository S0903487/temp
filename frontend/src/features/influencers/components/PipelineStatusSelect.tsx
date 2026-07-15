import { PIPELINE_STATUSES } from '../types'
import type { PipelineStatus } from '../types'

type PipelineStatusSelectProps = {
  value: PipelineStatus
  onChange: (value: PipelineStatus) => void
  disabled?: boolean
}

const COLORS: Record<PipelineStatus, string> = {
  New: 'border-slate-200 bg-slate-50 text-slate-700',
  Reviewed: 'border-blue-200 bg-blue-50/50 text-blue-700',
  Contacted: 'border-cyan-200 bg-cyan-50/50 text-cyan-700',
  Replied: 'border-teal-200 bg-teal-50/50 text-teal-700',
  Negotiating: 'border-amber-200 bg-amber-50/50 text-amber-700',
  Booked: 'border-indigo-200 bg-indigo-50/50 text-indigo-700',
  Completed: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  Inactive: 'border-rose-200 bg-rose-50/50 text-rose-700',
}

/** Badge for read-only display in tables/cards. */
export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${COLORS[status]}`}>
      {status}
    </span>
  )
}

/** Editable select for the profile page, using the same color language as the badge. */
export function PipelineStatusSelect({ value, onChange, disabled }: PipelineStatusSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as PipelineStatus)}
      className={`rounded border px-2 py-0.5 text-xs font-semibold outline-none transition ${COLORS[value]}`}
    >
      {PIPELINE_STATUSES.map((status) => (
        <option key={status} value={status} className="bg-white text-slate-900">
          {status}
        </option>
      ))}
    </select>
  )
}
