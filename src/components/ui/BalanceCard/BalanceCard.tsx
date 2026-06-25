import { formatMoney } from '@/core/money';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import styles from './BalanceCard.module.scss';
import { useAccount } from '@/features/wallet/hooks/useAccount';

export function BalanceCard() {
  const { data, isLoading, isError } = useAccount();

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeletonWrapper}>
          <Skeleton height="0.875rem" width="8rem" />
          <Skeleton height="2.25rem" width="12rem" />
          <Skeleton height="0.875rem" width="6rem" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.card}>
        <p className={styles.label}>Saldo disponible</p>
        <p className={styles.balance}>—</p>
        <p className={styles.holder}>No se pudo cargar</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <p className={styles.label}>Saldo disponible</p>
      <p className={styles.balance}>{formatMoney(data.account.balance)}</p>
      <p className={styles.holder}>{data.account.holder.name}</p>
    </div>
  );
}
