import styles from "./CardPreview.module.css";

export default function CardPreview({ token, loading }) {
  if (loading || !token) {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.frame} ${styles.skeleton}`} aria-hidden="true" />
      </div>
    );
  }

  const storyUrl = `/api/card?token=${encodeURIComponent(token)}&format=story`;
  const previewUrl = `/api/card?token=${encodeURIComponent(token)}&format=preview`;

  return (
    <div className={styles.wrap}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.frame}>
        <img
          className={styles.image}
          src={storyUrl}
          alt="Your weekly wrapped card: top track, minutes, replays and a personality line"
          width="290"
          height="516"
        />
      </div>
      <div className={styles.actions}>
        <a className="pill" href={storyUrl} download="weekly-wrapped-story.png">
          Download story PNG
        </a>
        <a className="pillGhost" href={previewUrl} download="weekly-wrapped-preview.png">
          Download link preview
        </a>
      </div>
      <p className={styles.hint}>1080×1920 for stories · 1200×630 for links</p>
    </div>
  );
}
