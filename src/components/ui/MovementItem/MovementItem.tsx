import { formatMoney } from '@/core/money';
import styles from './MovementItem.module.scss';
import clsx from 'clsx';
import { Movement } from '@/features/wallet/domain/types';

interface MovementItemProps {
  movement: Movement;
}

export function MovementItem({ movement }: MovementItemProps) {
  const isCredit = movement.direction === 'credit';
  const isPending = movement.status === 'pending';

  return (
    <div className={clsx(styles.item, isPending && styles.pending)}>
      <div className={clsx(styles.icon, isCredit ? styles.credit : styles.debit)}>
        {isCredit ? '↓' : '↑'}
      </div>

      <div className={styles.info}>
        <p className={styles.counterparty}>{movement.counterparty}</p>
        {movement.description && (
          <p className={styles.description}>{movement.description}</p>
        )}
        {isPending && (
          <p className={styles.description}>Pendiente</p>
        )}
      </div>

      <span className={clsx(
        styles.amount,
        isCredit ? styles.amountCredit : styles.amountDebit,
      )}>
        {isCredit ? '+' : '-'}{formatMoney(movement.amount)}
      </span>
    </div>
  );
}
