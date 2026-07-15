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
          className="rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
        >
          Add note
        </button>
      </form>

      {isLoading && <p className="text-xs text-slate-500">Loading notes…</p>}
      {!isLoading && notes.length === 0 && <p className="text-xs text-slate-500">No notes yet.</p>}

      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="rounded border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-slate-800 font-medium">{note.body}</p>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => onRemove(note.id)}
                className="shrink-0 text-slate-400 transition hover:text-rose-600 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(note.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
