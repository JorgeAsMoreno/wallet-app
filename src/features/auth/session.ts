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
