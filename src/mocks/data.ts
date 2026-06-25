import { cents } from '@/core/money';
import type { User, Session } from '@/features/auth/domain/types';
import type { Account, Movement } from '@/features/wallet/domain/types';
import type { Contact } from '@/features/transactions/domain/types';

// ---------------------------------------------------------------------------
// Usuario y sesión
// ---------------------------------------------------------------------------
export const MOCK_USER: User = {
  id: 'user-001',
  name: 'Carlos Mendoza',
  email: 'carlos@example.com',
  phone: '+5213121234567',
};

export const MOCK_SESSION: Session = {
  user: MOCK_USER,
  token: 'mock-token-xyz-001',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h
};

// ---------------------------------------------------------------------------
// Cuenta
// ---------------------------------------------------------------------------
export const MOCK_ACCOUNT: Account = {
  balance: cents(248750), // $2,487.50 MXN
  currency: 'MXN',
  holder: { id: MOCK_USER.id, name: MOCK_USER.name },
};

// ---------------------------------------------------------------------------
// Movimientos recientes
// ---------------------------------------------------------------------------
export const MOCK_MOVEMENTS: Movement[] = [
  {
    id: 'mov-001',
    direction: 'credit',
    amount: cents(500000),
    counterparty: 'Nómina Empresa S.A.',
    description: 'Pago quincenal',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'mov-002',
    direction: 'debit',
    amount: cents(35000),
    counterparty: 'Ana García',
    description: 'Cena del viernes',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'mov-003',
    direction: 'debit',
    amount: cents(120000),
    counterparty: 'Netflix',
    description: 'Suscripción mensual',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 'mov-004',
    direction: 'credit',
    amount: cents(80000),
    counterparty: 'Luis Torres',
    description: 'Me regresó el préstamo',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString(),
  },
  {
    id: 'mov-005',
    direction: 'debit',
    amount: cents(18500),
    counterparty: 'Spotify',
    description: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Contactos favoritos
// ---------------------------------------------------------------------------
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-001',
    name: 'Ana García',
    identifier: '+5213129876543',
    isFavorite: true,
  },
  {
    id: 'contact-002',
    name: 'Luis Torres',
    identifier: 'luis.torres@example.com',
    isFavorite: true,
  },
  {
    id: 'contact-003',
    name: 'María López',
    identifier: '+5213118765432',
    isFavorite: true,
  },
  {
    id: 'contact-004',
    name: 'Roberto Sánchez',
    identifier: 'roberto@example.com',
    isFavorite: false,
  },
];
