import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { fieldClass } from '../../../components/shared/fields'
import type { Tag } from '../types'

type TagSelectorProps = {
  tags: Tag[]
  suggestions: Tag[]
  isBusy?: boolean
  onAdd: (name: string) => void
  onRemove: (tagId: string) => void
}

/** Suggested starter tags from the influencer management plan, shown when the org has none yet. */
const DEFAULT_SUGGESTIONS = ['Micro', 'Macro', 'UGC', 'Luxury', 'Travel', 'Food', 'Tech', 'Gaming', 'VIP', 'Favorite', 'High Priority']

export function TagSelector({ tags, suggestions, isBusy, onAdd, onRemove }: TagSelectorProps) {
  const [draft, setDraft] = useState('')

  const attachedNames = new Set(tags.map((tag) => tag.name.toLowerCase()))
  const pickable = (suggestions.length > 0 ? suggestions.map((tag) => tag.name) : DEFAULT_SUGGESTIONS).filter(
    (name) => !attachedNames.has(name.toLowerCase())
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200"
          >
            {tag.name}
            <button
              type="button"
              aria-label={`Remove ${tag.name}`}
              onClick={() => onRemove(tag.id)}
              className="text-violet-300/70 transition hover:text-violet-100"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a tag…"
          disabled={isBusy}
          className={`${fieldClass} max-w-[200px]`}
        />
        <button
          type="submit"
          disabled={isBusy || !draft.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Add
        </button>
      </form>

      {pickable.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pickable.slice(0, 8).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onAdd(name)}
              disabled={isBusy}
              className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-400 transition hover:border-violet-400/50 hover:text-violet-200"
            >
              + {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
