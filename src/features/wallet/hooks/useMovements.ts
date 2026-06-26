'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMovements } from '../services';

export const movementsQueryKey = ['movements'] as const;

export function useMovements() {
  return useQuery({
    queryKey: movementsQueryKey,
    queryFn: fetchMovements,
    staleTime: 1000 * 30,
  });
}
