import { httpClient } from '@/core/http/client';
import type { AccountResponse, MovementsResponse } from '@/core/api/contracts';

export async function fetchAccount(): Promise<AccountResponse> {
  return httpClient<AccountResponse>('/api/account');
}

export async function fetchMovements(): Promise<MovementsResponse> {
  return httpClient<MovementsResponse>('/api/movements');
}
