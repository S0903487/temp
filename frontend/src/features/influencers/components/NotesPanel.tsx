import { useState } from 'react'
import type { FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { textAreaClass } from '../../../components/shared/fields'
import type { InfluencerNote } from '../types'

type NotesPanelProps = {
  notes: InfluencerNote[]
  isLoading?: boolean
  isSubmitting?: boolean
  onAdd: (body: string) => void
  onRemove: (noteId: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function NotesPanel({ notes, isLoading, isSubmitting, onAdd, onRemove }: NotesPanelProps) {
  const [draft, setDraft] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. Responds quickly, negotiable pricing, worked with Nike…"
          className={textAreaClass}
        />
        <button
          type="submit"
          disabled={isSubmitting || !draft.trim()}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add note
        </button>
      </form>

      {isLoading && <p className="text-sm text-slate-500">Loading notes…</p>}
      {!isLoading && notes.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}

      <ul className="space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-200">{note.body}</p>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => onRemove(note.id)}
                className="shrink-0 text-slate-500 transition hover:text-rose-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">{formatDate(note.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
