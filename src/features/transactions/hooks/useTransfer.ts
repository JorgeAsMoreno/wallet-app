'use client';

import { useMutation } from '@tanstack/react-query';
import { submitTransfer } from '../services';
import { mapToTransferOutcome } from '../domain/mappers';
import { useTransferStore } from '../store/transferStore';
import type { Cents } from '@/core/money';
import type { Contact } from '../domain/types';

export function useTransfer() {
  const setOutcome = useTransferStore((s) => s.setOutcome);
  const idempotencyKey = useTransferStore((s) => s.idempotencyKey);

  return useMutation({
    mutationFn: async ({
      amount,
      recipient,
    }: {
      amount: Cents;
      recipient: Contact;
    }) => {
      if (!idempotencyKey) return mapToTransferOutcome(undefined, new Error('missing idempotency key'));
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
