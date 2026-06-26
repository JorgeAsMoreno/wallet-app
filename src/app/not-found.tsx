import Link from 'next/link';
import styles from './not-found.module.scss';

export default function NotFound() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.icon}>🧭</div>
      <h1 className={styles.title}>Página no encontrada</h1>
      <p className={styles.description}>
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/" className={styles.link}>
        Volver al inicio
      </Link>
    </main>
  );
}
