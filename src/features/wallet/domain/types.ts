import type { Cents } from '@/core/money';
import type { User } from '@/features/auth/domain/types';

export interface Account {
  balance: Cents;
  currency: string;
  holder: Pick<User, 'id' | 'name'>;
}

export type MovementDirection = 'credit' | 'debit';
export type MovementStatus = 'completed' | 'pending' | 'failed';

export interface Movement {
  id: string;
  direction: MovementDirection;
  amount: Cents;
  counterparty: string;
  description: string | null;
  status: MovementStatus;
  createdAt: string;
}
