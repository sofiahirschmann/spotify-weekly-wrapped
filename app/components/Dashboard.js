"use client";

import { useEffect, useState } from "react";
import TopBar from "./TopBar";
import StatTile from "./StatTile";
import TrackList from "./TrackList";
import SuggestionShelf from "./SuggestionShelf";
import CardPreview from "./CardPreview";
import styles from "./Dashboard.module.css";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        if (!res.ok) throw new Error((await res.json()).error ?? "Request failed");
        return res.json();
      })
      .then((data) => {
        if (data && !cancelled) setState({ status: "ready", data });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "error") {
    return (
      <>
        <TopBar />
        <main className={styles.main}>
          <div className={styles.errorBox}>
            <h1 className="sectionTitle">Couldn&rsquo;t load your week</h1>
            <p className="subdued">{state.message}</p>
            <div className={styles.errorActions}>
              <button className="pill" onClick={() => window.location.reload()}>
                Try again
              </button>
              <a className="pillGhost" href="/api/auth/logout">
                Log out
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  const loading = state.status === "loading";
  const data = state.data;
  const stats = data?.stats;

  return (
    <>
      <TopBar user={data?.user} demo={data?.demo} />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>
            {loading ? " " : `${data.rangeLabel} · based on your last 50 plays`}
          </p>
          <h1 className={styles.headline}>
            {loading ? "Crunching your week…" : `${greeting()}, ${data.user?.name ?? "you"}.`}
          </h1>
        </header>

        <div className={styles.grid}>
          <div className={styles.mainCol}>
            <section className={styles.tiles} aria-label="Your week in numbers">
              {loading ? (
                Array.from({ length: 4 }, (_, i) => <StatTile key={i} loading />)
              ) : (
                <>
                  <StatTile
                    value={stats.minutes}
                    label="minutes listened*"
                    sub="*estimate from your last 50 plays"
                  />
                  <StatTile
                    value={stats.topArtist?.name ?? "—"}
                    label="most-played artist"
                    sub={stats.topArtist?.plays ? `${stats.topArtist.plays} plays this week` : "from your 4-week chart"}
                    size="text"
                  />
                  <StatTile
                    value={`${stats.replayCount}×`}
                    label="one song, replayed"
                    sub={stats.topTrack?.name ?? ""}
                  />
                  <StatTile
                    value={stats.busiestDay?.name ?? "—"}
                    label="busiest day"
                    sub={stats.busiestDay ? `${stats.busiestDay.count} plays` : ""}
                    size="text"
                  />
                </>
              )}
            </section>

            {!loading && stats.personality ? (
              <p className={styles.personality}>{stats.personality}</p>
            ) : null}

            <section className={styles.section} aria-label="Top tracks this week">
              <div className={styles.sectionHead}>
                <h2 className="sectionTitle">Top tracks this week</h2>
                <span className={`${styles.sectionNote} subdued`}>from your last 50 plays</span>
              </div>
              <TrackList tracks={stats?.topTracksOfWeek} loading={loading} />
            </section>

            <section className={styles.section} aria-label="Suggested for you">
              <div className={styles.sectionHead}>
                <h2 className="sectionTitle">Suggested for you</h2>
                <span className={`${styles.sectionNote} subdued`}>built from your own listening</span>
              </div>
              <SuggestionShelf suggestions={data?.suggestions} loading={loading} />
            </section>
          </div>

          <aside className={styles.rail} aria-label="Your shareable card">
            <CardPreview token={data?.cardToken} loading={loading} />
          </aside>
        </div>
      </main>
    </>
  );
}
