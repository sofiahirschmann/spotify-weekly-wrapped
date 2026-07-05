import styles from "./TrackList.module.css";

function Art({ track }) {
  if (track.art) {
    return <img className={styles.art} src={track.art} alt="" width="40" height="40" />;
  }
  return (
    <span className={`${styles.art} ${styles.artFallback}`} aria-hidden="true">
      {track.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Row({ track, index }) {
  const body = (
    <>
      <span className={styles.rank}>{index + 1}</span>
      <Art track={track} />
      <span className={styles.meta}>
        <span className={styles.name}>{track.name}</span>
        <span className={styles.artist}>{track.artist}</span>
      </span>
      <span className={styles.plays}>
        {track.plays === 1 ? "1 play" : `${track.plays} plays`}
      </span>
    </>
  );
  return track.url ? (
    <a className={styles.row} href={track.url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <div className={styles.row}>{body}</div>
  );
}

export default function TrackList({ tracks, loading }) {
  if (loading) {
    return (
      <div aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${styles.row} ${styles.skeleton}`} />
        ))}
      </div>
    );
  }
  if (!tracks?.length) {
    return (
      <p className="subdued">
        No repeat plays in your last 50 tracks yet — come back after a few more listens.
      </p>
    );
  }
  return (
    <div>
      {tracks.map((track, i) => (
        <Row key={track.id ?? i} track={track} index={i} />
      ))}
    </div>
  );
}
