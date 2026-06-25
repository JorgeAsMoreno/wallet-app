'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SESSION_COOKIE } from '@/features/auth/session';
import { useAuthStore } from '@/features/auth/store';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import styles from './page.module.scss';
import { MovementsList } from '@/components/ui/MovementList/MovementList';
import { BalanceCard } from '@/components/ui/BalanceCard/BalanceCard';

export default function HomePage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleLogout = () => {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
    clearSession();
    router.push('/login');
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.greeting}>
            Hola{session?.user.name ? `, ${session.user.name.split(' ')[0]}` : ''} 👋
          </p>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Salir
          </button>
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
