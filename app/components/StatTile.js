import styles from "./StatTile.module.css";

export default function StatTile({ value, label, sub, size = "number", loading }) {
  if (loading) {
    return <div className={`${styles.tile} ${styles.skeleton}`} aria-hidden="true" />;
  }
  return (
    <div className={styles.tile}>
      <div className={size === "text" ? styles.valueText : styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub ? <div className={styles.sub}>{sub}</div> : null}
    </div>
  );
}
