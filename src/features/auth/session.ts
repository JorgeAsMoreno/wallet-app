/**
 * Helpers para leer/escribir la sesión mockeada en una cookie.
 * `parseSessionCookie` se usa en el layout del grupo (app) (Server Component) y
 * `serializeSession` al iniciar sesión; el middleware (Edge) solo checa presencia.
 * Cookie simple en lugar de JWT real — suficiente para el reto.
 */

import type { Session } from './domain/types';

export const SESSION_COOKIE = 'wallet_session' as const;

export function parseSessionCookie(value: string | undefined): Session | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as Session;
  } catch {
    return null;
  }
}

export function serializeSession(session: Session): string {
  return encodeURIComponent(JSON.stringify(session));
}
