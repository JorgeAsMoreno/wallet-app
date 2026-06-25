import { describe, it, expect } from 'vitest';
import {
  amountIsPositive,
  balanceIsSufficient,
  hasRecipient,
  validateTransfer,
} from '@/features/transactions/domain/rules';
import { cents } from '@/core/money';
import type { Contact } from '@/features/transactions/domain/types';

const mockContact: Contact = {
  id: 'c-001',
  name: 'Ana García',
  identifier: '+5213129876543',
  isFavorite: true,
};

describe('amountIsPositive()', () => {
  it('retorna true para monto positivo', () => {
    expect(amountIsPositive(cents(100))).toBe(true);
  });

  it('retorna false para cero', () => {
    expect(amountIsPositive(cents(0))).toBe(false);
  });

  it('retorna false para negativo', () => {
    expect(amountIsPositive(cents(-1))).toBe(false);
  });
});

describe('balanceIsSufficient()', () => {
  it('retorna true si el monto es igual al saldo', () => {
    expect(balanceIsSufficient(cents(1000), cents(1000))).toBe(true);
  });

  it('retorna true si el monto es menor al saldo', () => {
    expect(balanceIsSufficient(cents(500), cents(1000))).toBe(true);
  });

  it('retorna false si el monto supera el saldo', () => {
    expect(balanceIsSufficient(cents(1001), cents(1000))).toBe(false);
  });
});

describe('hasRecipient()', () => {
  it('retorna true con contacto válido', () => {
    expect(hasRecipient(mockContact)).toBe(true);
  });

  it('retorna false con null', () => {
    expect(hasRecipient(null)).toBe(false);
  });
});

describe('validateTransfer()', () => {
  it('retorna ok con datos válidos', () => {
    const result = validateTransfer({
      amount: cents(1000),
      recipient: mockContact,
      availableBalance: cents(5000),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(1000);
      expect(result.value.recipient).toBe(mockContact);
    }
  });

  it('falla con monto cero', () => {
    const result = validateTransfer({
      amount: cents(0),
      recipient: mockContact,
      availableBalance: cents(5000),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.some((e) => e.code === 'AMOUNT_TOO_LOW')).toBe(true);
    }
  });

  it('falla con saldo insuficiente', () => {
    const result = validateTransfer({
      amount: cents(9999),
      recipient: mockContact,
      availableBalance: cents(1000),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.some((e) => e.code === 'INSUFFICIENT_FUNDS')).toBe(true);
    }
  });

  it('falla sin destinatario', () => {
    const result = validateTransfer({
      amount: cents(1000),
      recipient: null,
      availableBalance: cents(5000),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.some((e) => e.code === 'RECIPIENT_REQUIRED')).toBe(true);
    }
  });

  it('acumula múltiples violaciones', () => {
    const result = validateTransfer({
      amount: cents(0),
      recipient: null,
      availableBalance: cents(5000),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThanOrEqual(2);
    }
  });
});
