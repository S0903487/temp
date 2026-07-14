import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared visual shell for the login / register / forgot-password pages.
 * Matches the dark, violet-to-sky glass aesthetic used across the rest
 * of the app (see Sidebar/Topbar/StatCard).
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Ambient background glow, echoes the radial gradient in index.css */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 text-sm font-bold tracking-wide text-slate-950 shadow-lg shadow-violet-500/30">
            IO
          </div>
          <h1 className="text-2xl font-bold text-slate-50">InfluenceOS</h1>
          <h2 className="mt-1 text-lg font-medium text-slate-300">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {children}
        </div>

        {footer && <div className="text-center text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}
