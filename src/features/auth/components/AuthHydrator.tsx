'use client';

import { useEffect } from 'react';
import type { Session } from '../domain/types';
import { useAuthStore } from '../store';

/**
 * Hidrata el store de Zustand con la sesión leída en el servidor desde la cookie.
 * El seed ocurre solo en cliente (useEffect): el store es un singleton de módulo
 * y mutarlo durante el render en el servidor lo compartiría entre requests.
 */
export function AuthHydrator({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  useEffect(() => {
    useAuthStore.setState({ session });
  }, [session]);

  return <>{children}</>;
}
