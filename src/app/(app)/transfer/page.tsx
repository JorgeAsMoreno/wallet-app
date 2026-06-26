'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useTransferStore, WIZARD_STEP } from '@/features/transactions/store/transferStore';
import { Card } from '@/components/ui/Card/Card';
import styles from './page.module.scss';
import { AmountStep } from '@/components/ui/AmountStep/AmountStep';
import { ContactStep } from '@/components/ui/ContactStep/ContactStep';
import { SummaryStep } from '@/components/ui/SummaryStep/SummaryStep';
import { ResultStep } from '@/components/ui/ResultStep/ResultStep';

const STEP_ORDER = Object.values(WIZARD_STEP);

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
          {step !== WIZARD_STEP.Result && (
            <Link href="/" className={styles.backLink}>←</Link>
          )}
          <h1 className={styles.pageTitle}>Enviar dinero</h1>
        </header>

        {step !== WIZARD_STEP.Result && (
          <div className={styles.stepIndicator} aria-hidden="true">
            {STEP_ORDER.filter((s) => s !== WIZARD_STEP.Result).map((s, i) => (
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
          {step === WIZARD_STEP.Amount  && <AmountStep />}
          {step === WIZARD_STEP.Contact && <ContactStep />}
          {step === WIZARD_STEP.Summary && <SummaryStep />}
          {step === WIZARD_STEP.Result  && <ResultStep />}
        </Card>
      </div>
    </main>
  );
}
