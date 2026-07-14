import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import styles from './AppLayout.module.css'

function AppLayout() {
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
