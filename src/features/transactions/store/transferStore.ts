import { create } from 'zustand';
import type { Contact, TransferOutcome } from '../domain/types';
import type { Cents } from '@/core/money';

export const WIZARD_STEP = {
  Amount: 'amount',
  Contact: 'contact',
  Summary: 'summary',
  Result: 'result',
} as const;

export type WizardStep = (typeof WIZARD_STEP)[keyof typeof WIZARD_STEP];

interface TransferState {
  step: WizardStep;
  amount: Cents | null;
  recipient: Contact | null;
  idempotencyKey: string | null;
  outcome: TransferOutcome | null;

  setAmount: (amount: Cents) => void;
  setRecipient: (contact: Contact) => void;
  setOutcome: (outcome: TransferOutcome) => void;
  goTo: (step: WizardStep) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  step: WIZARD_STEP.Amount as WizardStep,
  amount: null,
  recipient: null,
  idempotencyKey: null,
  outcome: null,
};

const newIdempotencyKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useTransferStore = create<TransferState>((set) => ({
  ...INITIAL_STATE,

  setAmount: (amount) => set({ amount, step: WIZARD_STEP.Contact }),
  setRecipient: (recipient) =>
    set({ recipient, idempotencyKey: newIdempotencyKey(), step: WIZARD_STEP.Summary }),
  setOutcome: (outcome) => set({ outcome, step: WIZARD_STEP.Result }),
  goTo: (step) => set({ step }),
  reset: () => set(INITIAL_STATE),
}));
