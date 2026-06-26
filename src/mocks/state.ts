import { type Cents, subtractCents } from '@/core/money';
import type { Account, Movement } from '@/features/wallet/domain/types';
import { MOCK_ACCOUNT, MOCK_MOVEMENTS } from '@/mocks/data';
import { mockId } from '@/mocks/utils';

/**
 * Estado mutable en memoria del "servidor" mock. El saldo se descuenta en
 * /api/transfer pero se lee en /api/account (archivos distintos), así que el
 * estado vive aquí, en un único módulo compartido, en lugar de en cada ruta.
 *
 * Limitaciones honestas (es un mock): se reinicia al reiniciar el servidor o
 * con hot-reload, es un único saldo global (no por usuario) y no sería
 * consistente en un despliegue serverless con varias instancias. Suficiente
 * para la demo local.
 */
let account: Account = { ...MOCK_ACCOUNT };
let movements: Movement[] = [...MOCK_MOVEMENTS];

export const getAccount = (): Account => account;

export const getMovements = (): Movement[] => movements;

/**
 * Aplica una transferencia exitosa: descuenta el monto del saldo y registra el
 * movimiento correspondiente al inicio de la lista. Devuelve el movimiento creado.
 * Asume que la validación de saldo suficiente ya ocurrió antes de llamarse.
 */
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
