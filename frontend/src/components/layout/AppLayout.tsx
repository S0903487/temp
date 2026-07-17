import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuthUser } from '../../features/auth/hooks/useAuth'
import styles from './AppLayout.module.css'

function AppLayout() {
  const { data: user, isLoading } = useAuthUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-xs text-slate-500 font-bold">
        Checking session…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role || 'influencer'
  const path = location.pathname

  if (role === 'influencer') {
    const allowedPath = `/influencers/${user.id}`
    if (path !== allowedPath) {
      return <Navigate to={allowedPath} replace />
    }
  } else if (role === 'brand') {
    const allowedPath = '/settings'
    if (path !== allowedPath) {
      return <Navigate to={allowedPath} replace />
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Topbar />
        <main className={styles.page}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
