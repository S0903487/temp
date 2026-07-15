import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared visual shell for the login / register / forgot-password pages.
 * Clean, compact, light-themed, minimalistic design.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="relative w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">InfluenceOS</h1>
          <h2 className="mt-1 text-base font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>

        {footer && <div className="text-center text-xs text-slate-500">{footer}</div>}
      </div>
    </div>
  );
}
