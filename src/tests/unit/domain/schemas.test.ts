import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/features/auth/schema';
import { amountSchema, newContactSchema } from '@/features/transactions/schema';

describe('loginSchema', () => {
  it('acepta email válido', () => {
    const result = loginSchema.safeParse({ identifier: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('acepta teléfono válido', () => {
    const result = loginSchema.safeParse({ identifier: '+5213121234567' });
    expect(result.success).toBe(true);
  });

  it('rechaza string vacío', () => {
    const result = loginSchema.safeParse({ identifier: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza formato inválido', () => {
    const result = loginSchema.safeParse({ identifier: 'no-es-valido' });
    expect(result.success).toBe(false);
  });
});

describe('amountSchema', () => {
  it('acepta entero', () => {
    expect(amountSchema.safeParse('100').success).toBe(true);
  });

  it('acepta decimal con punto', () => {
    expect(amountSchema.safeParse('100.50').success).toBe(true);
  });

  it('acepta decimal con coma', () => {
    expect(amountSchema.safeParse('100,50').success).toBe(true);
  });

  it('rechaza vacío', () => {
    expect(amountSchema.safeParse('').success).toBe(false);
  });

  it('rechaza texto', () => {
    expect(amountSchema.safeParse('abc').success).toBe(false);
  });

  it('rechaza más de 2 decimales', () => {
    expect(amountSchema.safeParse('10.999').success).toBe(false);
  });
});

describe('newContactSchema', () => {
  it('acepta datos válidos', () => {
    const result = newContactSchema.safeParse({
      name: 'Ana García',
      identifier: '+5213121234567',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre muy corto', () => {
    const result = newContactSchema.safeParse({
      name: 'A',
      identifier: '+5213121234567',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza identifier vacío', () => {
    const result = newContactSchema.safeParse({
      name: 'Ana García',
      identifier: '',
    });
    expect(result.success).toBe(false);
  });
});
