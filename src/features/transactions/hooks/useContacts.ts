'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContacts } from '../services';
import { httpClient } from '@/core/http/client';
import type { CreateContactRequest, CreateContactResponse } from '@/core/api/contracts';

export const contactsQueryKey = ['contacts'] as const;

export function useContacts() {
  return useQuery({
    queryKey: contactsQueryKey,
    queryFn: fetchContacts,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactRequest) =>
      httpClient<CreateContactResponse>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsQueryKey });
    },
  });
}
