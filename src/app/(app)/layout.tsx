import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  parseSessionCookie,
} from '@/features/auth/session';
import { AuthHydrator } from '@/features/auth/components/AuthHydrator';

/**
 * Layout del grupo autenticado. Lee la sesión de la cookie en el servidor
 * (defensa en profundidad además del middleware) y la hidrata en el store del
 * cliente vía AuthHydrator, para que sobreviva a un refresh duro.
 *
 * `cookies()` es una Request-time API → opta este grupo a dynamic rendering,
 * lo cual es correcto: son datos por usuario.
 */
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
