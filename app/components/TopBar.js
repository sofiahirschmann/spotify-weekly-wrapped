import styles from "./TopBar.module.css";

export default function TopBar({ user, demo }) {
  return (
    <header className={styles.bar}>
      <a className={styles.brand} href="/dashboard">
        <span className={styles.mark} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <rect x="3" y="9" width="4" height="12" rx="2" />
            <rect x="10" y="3" width="4" height="18" rx="2" />
            <rect x="17" y="7" width="4" height="14" rx="2" />
          </svg>
        </span>
        Weekly Wrapped
        {demo ? <span className={styles.demoBadge}>demo data</span> : null}
      </a>

      <div className={styles.user}>
        {user ? (
          <>
            {user.avatar ? (
              <img className={styles.avatar} src={user.avatar} alt="" width="32" height="32" />
            ) : (
              <span className={styles.avatarFallback} aria-hidden="true">
                {(user.name ?? "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className={styles.name}>{user.name}</span>
            <a className={styles.logout} href="/api/auth/logout">
              Log out
            </a>
          </>
        ) : null}
      </div>
    </header>
  );
}
