'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAccount } from '../services';

export const accountQueryKey = ['account'] as const;

export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: fetchAccount,
    staleTime: 1000 * 30,
  });
}
