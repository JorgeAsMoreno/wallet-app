'use client';

/**
 * Error boundary global (convención de Next App Router). Captura errores de
 * render no controlados en cualquier ruta y ofrece reintentar sin recargar.
 * Los errores asíncronos de datos los maneja React Query; esto es la última red.
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import styles from './error.module.scss';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would go to an observability service (Sentry, etc.).
    console.error(error);
  }, [error]);

  return (
    <main className={styles.wrapper}>
      <div className={styles.icon}>⚠️</div>
      <h1 className={styles.title}>Algo salió mal</h1>
      <p className={styles.description}>
        Ocurrió un error inesperado. Puedes intentarlo de nuevo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
