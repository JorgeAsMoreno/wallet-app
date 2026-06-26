import { type Cents, subtractCents } from '@/core/money';
import type { Account, Movement } from '@/features/wallet/domain/types';
import type { Receipt } from '@/features/transactions/domain/types';
import { MOCK_ACCOUNT, MOCK_MOVEMENTS } from '@/mocks/data';
import { mockId } from '@/mocks/utils';


let account: Account = { ...MOCK_ACCOUNT };
let movements: Movement[] = [...MOCK_MOVEMENTS];

const processed = new Map<string, Receipt>();

export const getAccount = (): Account => account;

export const getMovements = (): Movement[] => movements;

export const getProcessedTransfer = (key: string): Receipt | undefined => processed.get(key);

export const recordTransfer = (key: string, receipt: Receipt): void => {
  processed.set(key, receipt);
};

export function applyTransfer(amount: Cents, recipientName: string): Movement {
  account = { ...account, balance: subtractCents(account.balance, amount) };

  const movement: Movement = {
    id: `mov-${mockId()}`,
    direction: 'debit',
    amount,
    counterparty: recipientName,
    description: 'Transferencia enviada',
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  movements = [movement, ...movements];
  return movement;
}
