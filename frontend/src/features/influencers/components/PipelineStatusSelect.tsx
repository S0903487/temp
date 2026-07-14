import { PIPELINE_STATUSES } from '../types'
import type { PipelineStatus } from '../types'

type PipelineStatusSelectProps = {
  value: PipelineStatus
  onChange: (value: PipelineStatus) => void
  disabled?: boolean
}

const COLORS: Record<PipelineStatus, string> = {
  New: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  Reviewed: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  Contacted: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  Replied: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
  Negotiating: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  Booked: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  Completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Inactive: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
}

/** Badge for read-only display in tables/cards. */
export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${COLORS[status]}`}>
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
      className={`rounded-full border px-3 py-1.5 text-sm font-medium outline-none transition ${COLORS[value]}`}
    >
      {PIPELINE_STATUSES.map((status) => (
        <option key={status} value={status} className="bg-slate-900 text-slate-100">
          {status}
        </option>
      ))}
    </select>
  )
}
