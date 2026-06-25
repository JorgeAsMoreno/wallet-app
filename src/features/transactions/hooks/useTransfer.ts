'use client';

import { useMutation } from '@tanstack/react-query';
import { submitTransfer } from '../services';
import { mapToTransferOutcome } from '../domain/mappers';
import { useTransferStore } from '../store/transferStore';
import type { Cents } from '@/core/money';
import type { Contact } from '../domain/types';

export function useTransfer() {
  const setOutcome = useTransferStore((s) => s.setOutcome);

  return useMutation({
    mutationFn: async ({
      amount,
      recipient,
    }: {
      amount: Cents;
      recipient: Contact;
    }) => {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        const response = await submitTransfer({
          amount,
          recipientId: recipient.id,
          idempotencyKey,
        });
        return mapToTransferOutcome(response, undefined);
      } catch (error) {
        return mapToTransferOutcome(undefined, error);
      }
    },
    onSuccess: (outcome) => {
      setOutcome(outcome);
    },
  });
}
