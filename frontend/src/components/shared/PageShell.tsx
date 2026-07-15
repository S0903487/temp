import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
}

function PageShell({ title, description, eyebrow, action, children }: PageShellProps) {
  return (
    <section className="space-y-4">
      <header className="rounded border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-base font-extrabold text-slate-900">{title}</h1>
            <p className="mt-0.5 max-w-2xl text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
          {action ? (
            <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {action}
            </div>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  )
}

export default PageShell
