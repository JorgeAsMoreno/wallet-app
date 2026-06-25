import { httpClient } from '@/core/http/client';
import type { ContactsResponse, TransferRequest, TransferResponse } from '@/core/api/contracts';

export async function fetchContacts(): Promise<ContactsResponse> {
  return httpClient<ContactsResponse>('/api/contacts');
}

export async function submitTransfer(
  payload: TransferRequest,
): Promise<TransferResponse> {
  return httpClient<TransferResponse>('/api/transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 12000,
  });
}
