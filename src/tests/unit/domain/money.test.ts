import { describe, it, expect } from 'vitest';
import {
  cents,
  parseAmountToCents,
  formatMoney,
  addCents,
  subtractCents,
} from '@/core/money';

describe('cents()', () => {
  it('crea un valor entero válido', () => {
    expect(cents(100)).toBe(100);
  });

  it('lanza error si recibe un float', () => {
    expect(() => cents(10.5)).toThrow('Cents requiere un entero');
  });
});

describe('parseAmountToCents()', () => {
  it('parsea entero simple', () => {
    const result = parseAmountToCents('150');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(15000);
  });

  it('parsea con dos decimales', () => {
    const result = parseAmountToCents('150.50');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(15050);
  });

  it('parsea con coma como separador decimal', () => {
    const result = parseAmountToCents('150,50');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(15050);
  });

  it('rechaza string vacío', () => {
    const result = parseAmountToCents('');
    expect(result.ok).toBe(false);
  });

  it('rechaza texto no numérico', () => {
    const result = parseAmountToCents('abc');
    expect(result.ok).toBe(false);
  });

  it('rechaza más de 2 decimales', () => {
    const result = parseAmountToCents('10.999');
    expect(result.ok).toBe(false);
  });

  it('no sufre imprecisión de float (0.1 + 0.2)', () => {
    const a = parseAmountToCents('0.10');
    const b = parseAmountToCents('0.20');
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(addCents(a.value, b.value)).toBe(30); // 30 cents
    }
  });
});

describe('formatMoney()', () => {
  it('formatea centavos a string de moneda', () => {
    expect(formatMoney(cents(248750))).toContain('2');
    expect(formatMoney(cents(248750))).toContain('487');
  });
});

describe('operaciones aritméticas', () => {
  it('addCents suma correctamente', () => {
    expect(addCents(cents(100), cents(200))).toBe(300);
  });

  it('subtractCents resta correctamente', () => {
    expect(subtractCents(cents(500), cents(200))).toBe(300);
  });
});
