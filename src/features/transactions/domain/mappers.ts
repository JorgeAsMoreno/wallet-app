import { z } from 'zod';
import type { TransferOutcome } from './types';
import { ApiErrorCode, type TransferResponse } from '@/core/api/contracts';
import { HttpError, NetworkError, TimeoutError } from '@/core/http/client';
import { cents } from '@/core/money';

const insufficientFundsBody = z.object({
  available: z.number(),
  requested: z.number(),
});

/**
 * Normaliza cualquier resultado del intento de transferencia (éxito, error HTTP,
 * error de red, timeout) al TransferOutcome del dominio. La UI solo ve esta
 * unión discriminada y hace un switch exhaustivo — nunca maneja HTTP directamente.
 */
export function mapToTransferOutcome(
  result: TransferResponse | unknown,
  error?: unknown,
): TransferOutcome {
  if (!error && result) {
    const data = result as TransferResponse;
    return {
      status: 'success',
      receipt: {
        ...data.receipt,
        amount: cents(data.receipt.amount),
      },
    };
  }

  if (error instanceof TimeoutError) {
    return { status: 'timeout' };
  }

  if (error instanceof NetworkError) {
    return { status: 'network_error' };
  }

  if (error instanceof HttpError) {
    if (error.code === ApiErrorCode.InsufficientFunds) {
      const parsed = insufficientFundsBody.safeParse(error.body);
      return {
        status: 'insufficient_funds',
        available: cents(parsed.success ? parsed.data.available : 0),
        requested: cents(parsed.success ? parsed.data.requested : 0),
      };
    }
    if (error.status >= 500 || error.status === 503) {
      return { status: 'network_error' };
    }
  }

  return { status: 'unknown_error' };
}
