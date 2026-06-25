import { describe, it, expect } from 'vitest';
import { mapToTransferOutcome } from '@/features/transactions/domain/mappers';
import { HttpError, NetworkError, TimeoutError } from '@/core/http/client';
import { Cents, cents } from '@/core/money';
import type { TransferResponse } from '@/core/api/contracts';

const mockReceipt: TransferResponse = {
  receipt: {
    id: 'txn-001',
    reference: 'REF-001',
    amount: 10000 as Cents,
    recipient: { name: 'Ana', identifier: '+521312' },
    createdAt: new Date().toISOString(),
  },
};

describe('mapToTransferOutcome()', () => {
  it('mapea respuesta exitosa a status success', () => {
    const outcome = mapToTransferOutcome(mockReceipt, undefined);
    expect(outcome.status).toBe('success');
    if (outcome.status === 'success') {
      expect(outcome.receipt.amount).toBe(cents(10000));
    }
  });

  it('mapea TimeoutError a status timeout', () => {
    const outcome = mapToTransferOutcome(undefined, new TimeoutError());
    expect(outcome.status).toBe('timeout');
  });

  it('mapea NetworkError a status network_error', () => {
    const outcome = mapToTransferOutcome(undefined, new NetworkError());
    expect(outcome.status).toBe('network_error');
  });

  it('mapea HttpError 503 a status network_error', () => {
    const outcome = mapToTransferOutcome(
      undefined,
      new HttpError(503, 'NETWORK_ERROR', 'Service unavailable'),
    );
    expect(outcome.status).toBe('network_error');
  });

  it('mapea HttpError INSUFFICIENT_FUNDS a status insufficient_funds', () => {
    const outcome = mapToTransferOutcome(
      undefined,
      new HttpError(422, 'INSUFFICIENT_FUNDS', 'Saldo insuficiente'),
    );
    expect(outcome.status).toBe('insufficient_funds');
  });

  it('mapea error desconocido a status unknown_error', () => {
    const outcome = mapToTransferOutcome(undefined, new Error('random'));
    expect(outcome.status).toBe('unknown_error');
  });
});
