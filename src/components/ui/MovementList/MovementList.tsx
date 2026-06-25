import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { MovementItem } from '../MovementItem/MovementItem';
import styles from './MovementList.module.scss';
import { useMovements } from '@/features/wallet/hooks/useMovements';

function MovementsSkeleton() {
  return (
    <div className={styles.list}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <Skeleton width="2.5rem" height="2.5rem" />
          <div className={styles.skeletonText}>
            <Skeleton width="60%" height="0.875rem" />
            <Skeleton width="40%" height="0.75rem" />
          </div>
          <Skeleton width="4rem" height="0.875rem" />
        </div>
      ))}
    </div>
  );
}

export function MovementsList() {
  const { data, isLoading, isError, refetch } = useMovements();

  return (
    <section className={styles.section}>
      <h2 className={styles.header}>Movimientos recientes</h2>

      {isLoading && <MovementsSkeleton />}

      {isError && (
        <div className={styles.errorState} role="alert">
          <p>No se pudieron cargar los movimientos.</p>
          <button className={styles.retryButton} onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <div className={styles.empty}>
          <p>Sin movimientos por ahora.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className={styles.list}>
          {data.items.map((movement) => (
            <MovementItem key={movement.id} movement={movement} />
          ))}
        </div>
      )}
    </section>
  );
}
