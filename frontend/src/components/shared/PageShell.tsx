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
      <header className="flex items-center justify-between gap-3 pb-1">
        <div>
          {eyebrow ? (
            <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="m-0 text-[1.1rem] font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
        {action ? (
          <div className="self-start flex-shrink-0">
            {action}
          </div>
        ) : null}
      </header>
      {children}
    </section>
  )
}

export default PageShell
