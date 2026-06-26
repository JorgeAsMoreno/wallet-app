'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitTransfer } from '../services';
import { mapToTransferOutcome } from '../domain/mappers';
import { useTransferStore } from '../store/transferStore';
import { subtractCents, type Cents } from '@/core/money';
import { accountQueryKey } from '@/features/wallet/hooks/useAccount';
import { movementsQueryKey } from '@/features/wallet/hooks/useMovements';
import type { AccountResponse, MovementsResponse } from '@/core/api/contracts';
import type { Movement } from '@/features/wallet/domain/types';
import type { Contact } from '../domain/types';

export function useTransfer() {
  const setOutcome = useTransferStore((s) => s.setOutcome);
  const idempotencyKey = useTransferStore((s) => s.idempotencyKey);
  const queryClient = useQueryClient();

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

      if (outcome.status !== 'success') return;

      const { receipt } = outcome;

      queryClient.setQueryData<AccountResponse>(accountQueryKey, (prev) =>
        prev
          ? {
              ...prev,
              account: {
                ...prev.account,
                balance: subtractCents(prev.account.balance, receipt.amount),
              },
            }
          : prev,
      );

      const movement: Movement = {
        id: receipt.id,
        direction: 'debit',
        amount: receipt.amount,
        counterparty: receipt.recipient.name,
        description: 'Transferencia enviada',
        status: 'completed',
        createdAt: receipt.createdAt,
      };

      queryClient.setQueryData<MovementsResponse>(movementsQueryKey, (prev) =>
        prev ? { ...prev, items: [movement, ...prev.items] } : prev,
      );
    },
  });
}
