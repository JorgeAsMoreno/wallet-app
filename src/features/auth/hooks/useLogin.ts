'use client';

import { useTransition } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { httpClient } from '@/core/http/client';
import type { LoginRequest, LoginResponse } from '@/core/api/contracts';
import { SESSION_COOKIE, serializeSession } from '../session';
import { useAuthStore } from '../store';

async function loginRequest(identifier: string): Promise<LoginResponse> {
  return httpClient<LoginResponse>('/api/session', {
    method: 'POST',
    body: JSON.stringify({ identifier } satisfies LoginRequest),
  });
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [isNavigating, startTransition] = useTransition();

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ session }) => {
      // Save to cookie for middleware + Server Components
      document.cookie = `${SESSION_COOKIE}=${serializeSession(session)}; path=/; max-age=${60 * 60 * 24}`;
      // Save in store for Client Components
      setSession(session);
      // Navigate inside a transition so the loading state stays active until the
      // home route finishes rendering, instead of dropping the moment the HTTP
      // request resolves (which left a ~0.5s gap with no spinner).
      startTransition(() => router.push('/'));
    },
  });

  // Keep the button in its loading state through both the request and the
  // subsequent navigation.
  return { ...mutation, isPending: mutation.isPending || isNavigating };
}
