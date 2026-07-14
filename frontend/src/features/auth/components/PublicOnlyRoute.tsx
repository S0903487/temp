import { Navigate, Outlet } from 'react-router-dom'
import { useIsAuthenticated } from '../hooks/useAuth'

/**
 * Wraps public-only routes (login, register, forgot-password).
 * If the user already has a valid session, bounce them straight to the
 * dashboard instead of showing the auth forms again.
 */
function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useIsAuthenticated()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
        Checking session…
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute
