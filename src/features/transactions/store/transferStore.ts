import { create } from 'zustand';
import type { Contact, TransferOutcome } from '../domain/types';
import type { Cents } from '@/core/money';

export type WizardStep = 'amount' | 'contact' | 'summary' | 'result';

interface TransferState {
  // Datos del wizard
  step: WizardStep;
  amount: Cents | null;
  recipient: Contact | null;
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
  outcome: null,
};

export const useTransferStore = create<TransferState>((set) => ({
  ...INITIAL_STATE,

  setAmount: (amount) => set({ amount, step: 'contact' }),
  setRecipient: (recipient) => set({ recipient, step: 'summary' }),
  setOutcome: (outcome) => set({ outcome, step: 'result' }),
  goTo: (step) => set({ step }),
  reset: () => set(INITIAL_STATE),
}));
