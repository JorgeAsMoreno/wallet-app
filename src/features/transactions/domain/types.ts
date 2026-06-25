import type { Cents } from '@/core/money';

export interface Contact {
  id: string;
  name: string;
  identifier: string;
  isFavorite: boolean;
}

export interface TransferInput {
  amount: Cents;
  recipient: Contact | null;
}

export interface Receipt {
  id: string;
  reference: string;
  amount: Cents;
  recipient: { name: string; identifier: string };
  createdAt: string;
}

export type TransferOutcome =
  | { status: 'success'; receipt: Receipt }
  | { status: 'insufficient_funds'; available: Cents; requested: Cents }
  | { status: 'network_error' }
  | { status: 'timeout' }
  | { status: 'unknown_error' };

export type TransferStatus = TransferOutcome['status'];
