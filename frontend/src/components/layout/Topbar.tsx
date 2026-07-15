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
        <input type="search" placeholder="** Search campaigns, influencers, clients.." />
      </label>

      <div className={styles.actions}>

        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <Bell
            size={30}
            type="button"
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={isMenuOpen}
            className={styles.avatarButton}
          >
            <Avatar name={user?.name ?? 'User'} size={30} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-48 rounded border border-slate-200 bg-white p-1 shadow-md">
              {user && (
                <div className="border-b border-slate-100 px-2 py-1.5">
                  <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="truncate text-[10px] text-slate-500">{user.email}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60 font-semibold"
              >
                <LogOut size={14} />
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
