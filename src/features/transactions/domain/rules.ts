import type { Cents } from '@/core/money';
import { type Result, ok, err } from '@/core/result';
import type { Contact } from './types';

export type TransferViolation =
  | { code: 'AMOUNT_TOO_LOW' }
  | { code: 'INSUFFICIENT_FUNDS'; available: Cents; requested: Cents }
  | { code: 'RECIPIENT_REQUIRED' };

export interface ValidatedTransfer {
  amount: Cents;
  recipient: Contact;
}

export interface TransferCandidate {
  amount: Cents;
  recipient: Contact | null;
  availableBalance: Cents;
}

export const amountIsPositive = (amount: Cents): boolean => amount > 0;

export const balanceIsSufficient = (amount: Cents, balance: Cents): boolean =>
  amount <= balance;

export const hasRecipient = (recipient: Contact | null): recipient is Contact =>
  recipient !== null;

export function validateTransfer(
  candidate: TransferCandidate,
): Result<ValidatedTransfer, TransferViolation[]> {
  const violations: TransferViolation[] = [];

  if (!amountIsPositive(candidate.amount)) {
    violations.push({ code: 'AMOUNT_TOO_LOW' });
  } else if (!balanceIsSufficient(candidate.amount, candidate.availableBalance)) {
    violations.push({
      code: 'INSUFFICIENT_FUNDS',
      available: candidate.availableBalance,
      requested: candidate.amount,
    });
  }

  const { recipient } = candidate;
  if (!hasRecipient(recipient)) {
    violations.push({ code: 'RECIPIENT_REQUIRED' });
  }

  // El guard de recipient además estrecha el tipo a Contact para el ok().
  if (violations.length > 0 || !hasRecipient(recipient)) {
    return err(violations);
  }

  return ok({ amount: candidate.amount, recipient });
}
