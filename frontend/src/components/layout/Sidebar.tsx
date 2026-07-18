import { useState } from 'react'
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Megaphone,
  Settings,
  Sparkles,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthUser } from '../../features/auth/hooks/useAuth'
import styles from './Sidebar.module.css'

type NavItem = {
  label: string
  icon: typeof LayoutGrid
  path: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
  { label: 'Influencers', icon: Users, path: '/influencers' },
  { label: 'Brand / Advertizer', icon: Briefcase, path: '/clients' },
  { label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Accounts', icon: ShieldCheck, path: '/accounts' },
  { label: 'AI Assistant', icon: Sparkles, path: '/ai' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

function Sidebar() {
  const { data: user } = useAuthUser()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar-collapsed', String(nextState))
  }

  const role = user?.role || 'influencer'

  const items = role === 'admin'
    ? navItems
    : role === 'influencer'
      ? [{ label: 'My Profile', icon: Users, path: `/influencers/${user?.id}` }]
      : [{ label: 'Brand Profile', icon: Settings, path: '/settings' }]

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.brandBlock}>
        {!isCollapsed && (
          <div className={styles.brandInfo}>
            <p className={styles.brandLabel}>InfluenceOS</p>
            <p className={styles.brandSubtext}>Sarmad Hussain's IMA</p>
          </div>
        )}
        {isCollapsed && (
          <div className={styles.brandLogoCollapsed}>IOS</div>
        )}
        <button
          onClick={toggleCollapse}
          className={styles.toggleButton}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      <nav className={styles.nav} aria-label="Sidebar navigation">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            title={isCollapsed ? label : undefined}
          >
            <Icon size={16} />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
