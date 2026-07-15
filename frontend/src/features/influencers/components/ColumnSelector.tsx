import { useState } from 'react'
import { Settings } from 'lucide-react'

type ColumnOption = {
  key: string
  label: string
}

type ColumnSelectorProps = {
  columns: ColumnOption[]
  visibleColumns: string[]
  onToggle: (columnKey: string) => void
}

export function ColumnSelector({ columns, visibleColumns, onToggle }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        id="col-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
      >
        <Settings size={14} className="text-slate-400" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-xl z-20 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Display Columns</p>
            {columns.map((col) => (
              <label key={col.key} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => onToggle(col.key)}
                  className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                {col.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
