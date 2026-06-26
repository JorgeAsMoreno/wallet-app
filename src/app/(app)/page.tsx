'use client';

import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store';
import { logoutAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import styles from './page.module.scss';
import { MovementsList } from '@/components/ui/MovementList/MovementList';
import { BalanceCard } from '@/components/ui/BalanceCard/BalanceCard';

export default function HomePage() {
  const session = useAuthStore((s) => s.session);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.greeting}>
            Hola{session?.user.name ? `, ${session.user.name.split(' ')[0]}` : ''} 👋
          </p>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutBtn}>
              Salir
            </button>
          </form>
        </header>

        <BalanceCard />

        <Link href="/transfer" className={styles.transferLink}>
          <Button>Enviar dinero</Button>
        </Link>

        <Card>
          <MovementsList />
        </Card>
      </div>
    </main>
  );
}
