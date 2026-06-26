import { formatMoney } from '@/core/money';
import { Button } from '@/components/ui/Button/Button';
import styles from './ResultStep.module.scss';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { accountQueryKey } from '@/features/wallet/hooks/useAccount';
import { movementsQueryKey } from '@/features/wallet/hooks/useMovements';
import { useTransferStore, WIZARD_STEP } from '@/features/transactions/store/transferStore';

export function ResultStep() {
  const outcome = useTransferStore((s) => s.outcome);
  const reset = useTransferStore((s) => s.reset);
  const goTo = useTransferStore((s) => s.goTo);
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!outcome) return null;

  const handleGoHome = () => {
    // Invalidar caché para que el home refresque saldo y movimientos
    queryClient.invalidateQueries({ queryKey: accountQueryKey });
    queryClient.invalidateQueries({ queryKey: movementsQueryKey });
    reset();
    router.push('/');
  };

  const handleRetry = () => {
    goTo(WIZARD_STEP.Summary);
  };

  // --- Éxito ---
  if (outcome.status === 'success') {
    const { receipt } = outcome;
    return (
      <div className={styles.wrapper}>
        <div className={styles.icon}>✅</div>
        <h2 className={styles.title}>¡Envío exitoso!</h2>
        <p className={styles.description}>
          Tu transferencia fue procesada correctamente.
        </p>

        <div className={styles.receiptCard}>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Referencia</span>
            <span className={styles.receiptValue}>{receipt.reference}</span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Monto</span>
            <span className={styles.receiptValue}>{formatMoney(receipt.amount)}</span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Para</span>
            <span className={styles.receiptValue}>{receipt.recipient.name}</span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.receiptLabel}>Fecha</span>
            <span className={styles.receiptValue}>
              {new Date(receipt.createdAt).toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={handleGoHome}>Ir al inicio</Button>
        </div>
      </div>
    );
  }

  // --- Fondos insuficientes ---
  if (outcome.status === 'insufficient_funds') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.icon}>💳</div>
        <h2 className={styles.title}>Saldo insuficiente</h2>
        <p className={styles.description}>
          No tienes saldo suficiente para completar esta transferencia.{'\n'}
          Disponible: {formatMoney(outcome.available)}
        </p>
        <div className={styles.actions}>
          <Button onClick={() => goTo(WIZARD_STEP.Amount)}>Cambiar monto</Button>
          <Button variant="secondary" onClick={handleGoHome}>Ir al inicio</Button>
        </div>
      </div>
    );
  }

  // --- Timeout ---
  if (outcome.status === 'timeout') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.icon}>⏱️</div>
        <h2 className={styles.title}>Tiempo de espera agotado</h2>
        <p className={styles.description}>
          La operación tardó demasiado. Tu dinero no fue debitado.
          Podés intentarlo de nuevo.
        </p>
        <div className={styles.actions}>
          <Button onClick={handleRetry}>Reintentar</Button>
          <Button variant="secondary" onClick={handleGoHome}>Ir al inicio</Button>
        </div>
      </div>
    );
  }

  // --- Error de red ---
  if (outcome.status === 'network_error') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.icon}>📡</div>
        <h2 className={styles.title}>Error de conexión</h2>
        <p className={styles.description}>
          No pudimos conectarnos al servidor. Verificá tu conexión e intentá de nuevo.
        </p>
        <div className={styles.actions}>
          <Button onClick={handleRetry}>Reintentar</Button>
          <Button variant="secondary" onClick={handleGoHome}>Ir al inicio</Button>
        </div>
      </div>
    );
  }

  // --- Error desconocido (fallback) ---
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>⚠️</div>
      <h2 className={styles.title}>Algo salió mal</h2>
      <p className={styles.description}>
        Ocurrió un error inesperado. Si el problema persiste, contactá soporte.
      </p>
      <div className={styles.actions}>
        <Button onClick={handleRetry}>Reintentar</Button>
        <Button variant="secondary" onClick={handleGoHome}>Ir al inicio</Button>
      </div>
    </div>
  );
}
