import { create } from 'zustand';
import type { Contact, TransferOutcome } from '../domain/types';
import type { Cents } from '@/core/money';

export type WizardStep = 'amount' | 'contact' | 'summary' | 'result';

interface TransferState {
  // Datos del wizard
  step: WizardStep;
  amount: Cents | null;
  recipient: Contact | null;
  // Clave de idempotencia del envío actual. Se genera al fijar el destinatario
  // (entrar al resumen) y se reutiliza en los reintentos del mismo envío lógico,
  // que es justo cuando importa. Cambiar destinatario/monto la regenera; reset() la limpia.
  idempotencyKey: string | null;
  outcome: TransferOutcome | null;

  // Acciones
  setAmount: (amount: Cents) => void;
  setRecipient: (contact: Contact) => void;
  setOutcome: (outcome: TransferOutcome) => void;
  goTo: (step: WizardStep) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  step: 'amount' as WizardStep,
  amount: null,
  recipient: null,
  idempotencyKey: null,
  outcome: null,
};

const newIdempotencyKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useTransferStore = create<TransferState>((set) => ({
  ...INITIAL_STATE,

  setAmount: (amount) => set({ amount, step: 'contact' }),
  setRecipient: (recipient) =>
    set({ recipient, idempotencyKey: newIdempotencyKey(), step: 'summary' }),
  setOutcome: (outcome) => set({ outcome, step: 'result' }),
  goTo: (step) => set({ step }),
  reset: () => set(INITIAL_STATE),
}));
