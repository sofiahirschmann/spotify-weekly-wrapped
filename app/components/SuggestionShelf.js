import styles from "./SuggestionShelf.module.css";

// Eyebrow encodes which engine produced the suggestion — real information,
// not decoration. Colors come from the Wrapped accent set.
const KIND_META = {
  fresh: { label: "Fresh drop", className: styles.kindFresh },
  rediscovery: { label: "Rediscovery", className: styles.kindRediscovery },
  deepcut: { label: "Deep cut", className: styles.kindDeepcut },
};

function Art({ item }) {
  if (item.art) {
    return <img className={styles.art} src={item.art} alt="" loading="lazy" />;
  }
  return (
    <span className={`${styles.art} ${styles.artFallback} ${KIND_META[item.kind]?.className ?? ""}`}>
      {item.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function SuggestionShelf({ suggestions, loading }) {
  if (loading) {
    return (
      <div className={styles.shelf} aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${styles.card} ${styles.skeleton}`} />
        ))}
      </div>
    );
  }
  if (!suggestions?.length) {
    return (
      <p className="subdued">
        Nothing to suggest yet — a few more days of listening gives the engines
        something to work with.
      </p>
    );
  }
  return (
    <div className={styles.shelf}>
      {suggestions.map((item) => {
        const kind = KIND_META[item.kind] ?? KIND_META.deepcut;
        const inner = (
          <>
            <div className={styles.artWrap}>
              <Art item={item} />
              <span className={styles.playButton} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M8 5.14v13.72c0 .83.9 1.34 1.61.92l10.9-6.86a1.08 1.08 0 0 0 0-1.84L9.61 4.22A1.08 1.08 0 0 0 8 5.14Z" />
                </svg>
              </span>
            </div>
            <span className={`${styles.kind} ${kind.className}`}>{kind.label}</span>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.artist}>{item.artist}</span>
            <span className={styles.reason}>{item.reason}</span>
          </>
        );
        return item.url ? (
          <a key={item.id} className={styles.card} href={item.url} target="_blank" rel="noreferrer">
            {inner}
          </a>
        ) : (
          <div key={item.id} className={styles.card}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
