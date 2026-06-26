/**
 * Página 404 global (convención de Next App Router). El archivo raíz
 * `app/not-found` atrapa cualquier URL que no coincida con ninguna ruta y
 * muestra esta UI compuesta con el root layout.
 */

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
