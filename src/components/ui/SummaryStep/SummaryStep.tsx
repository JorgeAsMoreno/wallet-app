import { formatMoney } from '@/core/money';
import { Button } from '@/components/ui/Button/Button';
import styles from './SummaryStep.module.scss';
import { useTransferStore } from '@/features/transactions/store/transferStore';
import { useTransfer } from '@/features/transactions/hooks/useTransfer';

export function SummaryStep() {
  const amount = useTransferStore((s) => s.amount);
  const recipient = useTransferStore((s) => s.recipient);
  const goTo = useTransferStore((s) => s.goTo);
  const { mutate: transfer, isPending } = useTransfer();

  if (!amount || !recipient) return null;

  const handleConfirm = () => {
    transfer({ amount, recipient });
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.backButton} onClick={() => goTo('contact')}>
        ← Volver
      </button>

      <h2 className={styles.title}>Resumen</h2>

      <div className={styles.summaryCard}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Monto</span>
          <span className={styles.amountValue}>{formatMoney(amount)}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <span className={styles.rowLabel}>Para</span>
          <span className={styles.rowValue}>{recipient.name}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Cuenta</span>
          <span className={styles.rowValue}>{recipient.identifier}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={handleConfirm} isLoading={isPending}>
          Confirmar envío
        </Button>
        <Button variant="secondary" onClick={() => goTo('contact')}>
          Cambiar destinatario
        </Button>
      </div>
    </div>
  );
}
