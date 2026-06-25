'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useTransferStore } from '@/features/transactions/store/transferStore';
import { Card } from '@/components/ui/Card/Card';
import styles from './page.module.scss';
import { AmountStep } from '@/components/ui/AmountStep/AmountStep';
import { ContactStep } from '@/components/ui/ContactStep/ContactStep';
import { SummaryStep } from '@/components/ui/SummaryStep/SummaryStep';
import { ResultStep } from '@/components/ui/ResultStep/ResultStep';

const STEP_ORDER = ['amount', 'contact', 'summary', 'result'] as const;

export default function TransferPage() {
  const step = useTransferStore((s) => s.step);
  const reset = useTransferStore((s) => s.reset);
  const currentIndex = STEP_ORDER.indexOf(step);

  // El store del wizard es global de módulo: al salir del flujo lo limpiamos
  // para que la próxima entrada arranque siempre en el paso inicial, sin
  // datos stale ni parpadeo de un paso anterior.
  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          {step !== 'result' && (
            <Link href="/" className={styles.backLink}>←</Link>
          )}
          <h1 className={styles.pageTitle}>Enviar dinero</h1>
        </header>

        {step !== 'result' && (
          <div className={styles.stepIndicator} aria-hidden="true">
            {STEP_ORDER.filter((s) => s !== 'result').map((s, i) => (
              <div
                key={s}
                className={clsx(
                  styles.stepDot,
                  i <= currentIndex && styles.active,
                )}
              />
            ))}
          </div>
        )}

        <Card>
          {step === 'amount'  && <AmountStep />}
          {step === 'contact' && <ContactStep />}
          {step === 'summary' && <SummaryStep />}
          {step === 'result'  && <ResultStep />}
        </Card>
      </div>
    </main>
  );
}
