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
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700"
          >
            {tag.name}
            <button
              type="button"
              aria-label={`Remove ${tag.name}`}
              onClick={() => onRemove(tag.id)}
              className="text-slate-400 hover:text-slate-900 transition cursor-pointer"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <p className="text-xs text-slate-400">No tags yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a tag…"
          disabled={isBusy}
          className={`${fieldClass} max-w-[150px]`}
        />
        <button
          type="submit"
          disabled={isBusy || !draft.trim()}
          className="inline-flex items-center gap-1 rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={12} />
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
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:border-slate-900 hover:text-slate-900 transition cursor-pointer"
            >
              + {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
