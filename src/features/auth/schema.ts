import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,15}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Ingresa tu teléfono o correo')
    .refine((v) => EMAIL_RE.test(v) || PHONE_RE.test(v), {
      message: 'Ingresa un correo o teléfono válido',
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export type IdentifierKind = 'email' | 'phone';

export function classifyIdentifier(value: string): IdentifierKind {
  return EMAIL_RE.test(value) ? 'email' : 'phone';
}
