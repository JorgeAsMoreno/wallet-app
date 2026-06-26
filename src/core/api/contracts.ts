import type { Cents } from '@/core/money';
import type { Session } from '@/features/auth/domain/types';
import type { Account, Movement } from '@/features/wallet/domain/types';
import type { Contact, Receipt } from '@/features/transactions/domain/types';

export enum ApiErrorCode {
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  ValidationError = 'VALIDATION_ERROR',
  NetworkError = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',
  UnknownError = 'UNKNOWN_ERROR',
  HttpError = 'HTTP_ERROR',
}

export interface ApiError {
  code: string;
  message: string;
}

export interface InsufficientFundsErrorBody extends ApiError {
  code: ApiErrorCode.InsufficientFunds;
  available: number;
  requested: number;
}

export interface LoginRequest {
  identifier: string;
}
export interface LoginResponse {
  session: Session;
}

export interface AccountResponse {
  account: Account;
}

export interface MovementsResponse {
  items: Movement[];
  nextCursor: string | null;
}

export interface ContactsResponse {
  contacts: Contact[];
}

export interface CreateContactRequest {
  name: string;
  identifier: string;
}
export interface CreateContactResponse {
  contact: Contact;
}

export interface TransferRequest {
  amount: Cents;
  recipientId: string;
  idempotencyKey: string;
}

export interface TransferResponse {
  receipt: Receipt;
}
