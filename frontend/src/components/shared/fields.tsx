import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Shared className for text inputs, number inputs, date inputs, and
 * textareas. Keeping this in one place is what keeps every form in the
 * app (auth pages, Add Campaign, Add Client, Add Influencer, Log
 * analytics, Settings…) visually consistent instead of drifting.
 */
export const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-black/60 focus:ring-2 focus:ring-black/10'

/** Same visual language, sized for a multi-line textarea. */
export const textAreaClass = `min-h-20 ${fieldClass}`

/** Shared label style used above every field. */
export const labelClass = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1'

/**
 * Drop-in replacement for a native <select> that matches fieldClass and
 * swaps the OS-drawn arrow for a themed chevron, so dropdowns render the
 * same way across every browser/OS instead of using default UA chrome.
 */
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${fieldClass} appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  )
}
