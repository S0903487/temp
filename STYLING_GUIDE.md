# InfluenceOS Style Guide

This guide documents the design system and Tailwind patterns used throughout **InfluenceOS (Sarmad Hussain's IMA)** to ensure future style changes are clean, minimal, compact, and consistent.

---

## 1. Core Visual Principles

* **Strict Contrast Theme**: No heavy dark backgrounds or glowing neon colors. Everything uses a premium, high-contrast, light off-white and slate palette.
* **Compact & Organized Grid**: Densities are kept high with tiny font indicators, compact padding, and elegant spacing boundaries.
* **Layout Honesty**: No simulated log consoles, raw status dots, or artificial metrics. The visual focus is on user content.

---

## 2. Core Color & Border Tokens

Always use these exact Tailwind classes to maintain color consistency across components:

| Element | Tailwind Class | Usage / Context |
| :--- | :--- | :--- |
| **App Canvas** | `bg-slate-50` / `#f9fafb` | Root outer page background |
| **Card Container** | `bg-white rounded border border-slate-200 shadow-xs` | Bento panels, profile blocks, detail sections |
| **Primary Headings** | `text-slate-900 font-extrabold` / `font-bold` | App titles, dialog headers, profile names |
| **Secondary Headings** | `text-xs font-bold text-slate-700` | Subtitle sections, form groups |
| **Eyebrows / Metadata** | `text-[10px] font-bold uppercase tracking-wider text-slate-400` | Section labels, small indicators |
| **Body & Labels** | `text-slate-600 text-xs` / `text-slate-500` | Paragraphs, description texts, list metadata |
| **Borders & Dividers** | `border-slate-100` / `border-slate-200` | Table row divides, section separator borders |

---

## 3. Shared Form Classes (`/frontend/src/components/shared/fields.tsx`)

To keep input styling identical across all search panels and modal fields, do **not** use custom input/select styles. Instead, import and apply the shared form variables:

```tsx
import { fieldClass, labelClass, textAreaClass, Select } from '../../../components/shared/fields'

// Example:
<label className={labelClass}>
  <span className="mb-1 block">Your Label Name</span>
  <input className={fieldClass} placeholder="Enter value..." />
</label>
```

### Underlying Form CSS tokens:
* **Inputs & Selects (`fieldClass`)**: `block w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-slate-900 focus:ring-0 transition`
* **Labels (`labelClass`)**: `block text-[10px] font-bold uppercase tracking-wider text-slate-400`

---

## 4. Modal Panels Pattern

Modals should always follow a consistent, compact light container structure:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs px-4 py-6">
  <div className="w-full max-w-md max-h-[90vh] rounded border border-slate-200 bg-white p-5 shadow-xl flex flex-col overflow-hidden">
    
    {/* Header */}
    <div className="flex items-center justify-between flex-shrink-0">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</p>
        <h2 className="text-base font-extrabold text-slate-900">Add Item</h2>
      </div>
      <button onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition">
        <X size={14} />
      </button>
    </div>

    {/* Scrollable Form Body */}
    <form className="mt-4 flex-1 overflow-y-auto pr-1 grid gap-3">
      {/* Fields go here... */}

      {/* Sticky Compact Footer Actions */}
      <div className="sticky bottom-0 bg-white pt-3 pb-0.5 mt-3 flex justify-end gap-2 border-t border-slate-100">
        <button type="button" onClick={onClose} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
          Save Changes
        </button>
      </div>
    </form>
  </div>
</div>
```

---

## 5. Summary Checklists

If you add a new page or make an adjustment:
1. Ensure the outer container is wrapped in `<PageShell title="..." description="...">`.
2. Check that the table columns have a thin grey border (`border-t border-slate-100`) and the table header uses `text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50`.
3. Verify that zero raw dark-mode classes (e.g. `bg-slate-950`, `border-slate-800`, `text-cyan-400`) are present in visual screens unless they represent static status badges.
