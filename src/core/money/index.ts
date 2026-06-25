import { type Result, ok, err } from '@/core/result';

declare const CENTS_BRAND: unique symbol;
export type Cents = number & { readonly [CENTS_BRAND]: never };

export const CURRENCY = 'MXN' as const;
export const LOCALE = 'es-MX' as const;

export function cents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`Cents requiere un entero. Recibido: ${value}`);
  }
  return value as Cents;
}

export const ZERO_CENTS = cents(0);

export type AmountParseError = 'INVALID_FORMAT';

export function parseAmountToCents(
  input: string,
): Result<Cents, AmountParseError> {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return err('INVALID_FORMAT');

  const [intPart = '0', fracPart = ''] = normalized.split('.');
  const total = Number(intPart) * 100 + Number(fracPart.padEnd(2, '0'));
  return ok(cents(total));
}

const formatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
});

export function formatMoney(value: Cents): string {
  return formatter.format(value / 100);
}

export const addCents = (a: Cents, b: Cents): Cents => cents(a + b);
export const subtractCents = (a: Cents, b: Cents): Cents => cents(a - b);
