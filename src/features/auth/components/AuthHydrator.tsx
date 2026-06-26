'use client';

import { useEffect } from 'react';
import type { Session } from '../domain/types';
import { useAuthStore } from '../store';

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
