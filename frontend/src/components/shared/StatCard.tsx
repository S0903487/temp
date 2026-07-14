import styles from './StatCard.module.css'

type StatCardProps = {
  title: string
  value: string
  detail: string
  accent: 'violet' | 'cyan' | 'amber'
}

function StatCard({ title, value, detail, accent }: StatCardProps) {
  return (
    <article className={`${styles.card} ${styles[accent]}`}>
      <p className={styles.title}>{title}</p>
      <h3 className={styles.value}>{value}</h3>
      <p className={styles.detail}>{detail}</p>
    </article>
  )
}

export default StatCard
