import { Navigate, Outlet } from 'react-router-dom'
import { useIsAuthenticated } from '../hooks/useAuth'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useIsAuthenticated()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
        Checking session…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
