import { z } from 'zod';

export const amountSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa un monto')
  .regex(/^\d+([.,]\d{1,2})?$/, 'Monto inválido (máx. 2 decimales)');

export const newContactSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto'),
  identifier: z.string().trim().min(1, 'Ingresa un teléfono, correo o CLABE'),
});

export type NewContactValues = z.infer<typeof newContactSchema>;

export const transferRequestSchema = z.object({
  amount: z.number().int().nonnegative(),
  recipientId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});
