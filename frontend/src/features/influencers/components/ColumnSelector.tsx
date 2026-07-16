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
        className={`inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:text-black hover:border-black transition cursor-pointer ${
          isOpen ? 'border-black text-black bg-slate-50' : ''
        }`}
      >
        <Settings size={11} className="text-slate-500" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 max-h-72 overflow-y-auto themed-scrollbar rounded border border-slate-200 bg-white p-2.5 shadow-sm z-20 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Display Columns</p>
            {columns.map((col) => (
              <label key={col.key} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 hover:text-black cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => onToggle(col.key)}
                  className="rounded border-slate-300 text-black focus:ring-0 cursor-pointer"
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
