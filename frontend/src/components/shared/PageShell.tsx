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
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
          {action ? (
            <div className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-300">
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
