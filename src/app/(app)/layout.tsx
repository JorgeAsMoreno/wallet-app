import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  parseSessionCookie,
} from '@/features/auth/session';
import { AuthHydrator } from '@/features/auth/components/AuthHydrator';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session || new Date(session.expiresAt) < new Date()) {
    redirect('/login');
  }

  return <AuthHydrator session={session}>{children}</AuthHydrator>;
}
