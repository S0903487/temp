import {
  BarChart3,
  Briefcase,
  LayoutGrid,
  Megaphone,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

type NavItem = {
  label: string
  icon: typeof LayoutGrid
  path: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
  { label: 'Influencers', icon: Users, path: '/influencers' },
  { label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
  { label: 'Clients', icon: Briefcase, path: '/clients' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'AI Assistant', icon: Sparkles, path: '/ai' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <div className={styles.brandIcon}>IO</div>
        <div>
          <p className={styles.brandLabel}>InfluenceOS</p>
          <p className={styles.brandSubtext}>Growth Studio</p>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Sidebar navigation">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
