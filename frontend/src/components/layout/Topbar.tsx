import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Search } from 'lucide-react'
import { useAuthUser, useLogout } from '../../features/auth'
import { Avatar } from '../shared/Avatar'
import styles from './Topbar.module.css'

function Topbar() {
  const { data: user } = useAuthUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span>InfluenceOS</span>
      </div>

      <label className={styles.searchBox}>
        <Search size={16} />
        <input type="search" placeholder="Search campaigns, influencers, clients" />
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={isMenuOpen}
            className={styles.avatarButton}
          >
            <Avatar name={user?.name ?? 'User'} size={40} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-slate-950/40">
              {user && (
                <div className="border-b border-slate-800 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
              >
                <LogOut size={16} />
                {logout.isPending ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
