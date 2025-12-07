import styles from './Skeleton.module.css';

export function Skeleton({ width = '100%', height = '20px' }: { width?: string; height?: string }) {
  return <div className={styles.skeleton} style={{ width, height }} />;
}