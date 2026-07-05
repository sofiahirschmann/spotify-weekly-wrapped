import { redirect } from "next/navigation";
import { getSession, isLoggedIn } from "@/lib/session";
import { demoEnabled } from "@/lib/demo";
import styles from "./page.module.css";

const ERROR_COPY = {
  access_denied: "You said no on the Spotify screen, so nothing was connected.",
  state_mismatch: "That login attempt expired. Start it again from here.",
  token_exchange_failed: "Spotify didn't accept the login. Try again in a moment.",
};

export default async function Home({ searchParams }) {
  const session = await getSession();
  if (isLoggedIn(session)) redirect("/dashboard");

  const params = await searchParams;
  const error = ERROR_COPY[params?.error];

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <rect x="3" y="9" width="4" height="12" rx="2" />
              <rect x="10" y="3" width="4" height="18" rx="2" />
              <rect x="17" y="7" width="4" height="14" rx="2" />
            </svg>
          </span>
          Weekly Wrapped
        </div>

        <h1 className={styles.headline}>
          Your week in music,
          <br />
          as a card you can post.
        </h1>

        <p className={styles.sub}>
          Connect Spotify and get your top track, most-replayed artist, listening
          minutes, and one line of personality — every week, as a shareable image.
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <a className="pill" href="/api/auth/login">
          Continue with Spotify
        </a>

        {demoEnabled() ? (
          <a className={styles.demoLink} href="/dashboard">
            or browse with demo data
          </a>
        ) : null}

        <p className={styles.finePrint}>
          Uses only your top tracks and last 50 plays. While this app is in
          Spotify&rsquo;s development mode, only allowlisted accounts can log in.
        </p>
      </div>
    </main>
  );
}
