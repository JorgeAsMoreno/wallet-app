import { NextResponse } from 'next/server';
import { ApiErrorCode, type TransferResponse } from '@/core/api/contracts';
import { cents } from '@/core/money';
import { MOCK_CONTACTS } from '@/mocks/data';
import { getAccount, applyTransfer, getProcessedTransfer, recordTransfer } from '@/mocks/state';
import { simulateDelay, mockId, pickTransferScenario } from '@/mocks/utils';
import { validateTransfer } from '@/features/transactions/domain/rules';
import { transferRequestSchema } from '@/features/transactions/schema';

export async function POST(request: Request) {
  // Validate the contract first: malformed body → clean 422, never a 500.
  const parsed = transferRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { code: ApiErrorCode.ValidationError, message: 'Datos de transferencia inválidos' },
      { status: 422 },
    );
  }
  const body = parsed.data;

  // Idempotency: a retry of an already-applied transfer returns the same
  // receipt without charging again (defends against double charges on retry).
  const alreadyProcessed = getProcessedTransfer(body.idempotencyKey);
  if (alreadyProcessed) {
    return NextResponse.json({ receipt: alreadyProcessed }, { status: 200 });
  }

  const scenario = pickTransferScenario();

  // Timeout: we do not respond, the client must handle the AbortController
  if (scenario === 'timeout') {
    await simulateDelay(15000);
    return NextResponse.json({ code: ApiErrorCode.Timeout, message: 'Tiempo de espera agotado' }, { status: 408 });
  }

  await simulateDelay(1200);

  if (scenario === 'network_error') {
    return NextResponse.json({ code: ApiErrorCode.NetworkError, message: 'Error de red' }, { status: 503 });
  }

  if (scenario === 'unknown_error') {
    return NextResponse.json({ code: ApiErrorCode.UnknownError, message: 'Error inesperado' }, { status: 500 });
  }

  // --- Business validation on the server (defense in depth) ---
  const recipient = MOCK_CONTACTS.find((c) => c.id === body.recipientId) ?? null;

  const validation = validateTransfer({
    amount: cents(body.amount),
    recipient,
    availableBalance: getAccount().balance,
  });

  if (!validation.ok) {
    const hasFunds = validation.error.find((e) => e.code === 'INSUFFICIENT_FUNDS');
    if (hasFunds && hasFunds.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        {
          code: ApiErrorCode.InsufficientFunds,
          message: 'Saldo insuficiente',
          available: hasFunds.available,
          requested: hasFunds.requested,
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { code: ApiErrorCode.ValidationError, message: 'Datos de transferencia inválidos' },
      { status: 422 },
    );
  }

  // --- Success: we discount the balance and record the movement ---
  applyTransfer(cents(body.amount), validation.value.recipient.name);

  const response: TransferResponse = {
    receipt: {
      id: `txn-${mockId()}`,
      reference: `REF-${mockId().toUpperCase()}`,
      amount: cents(body.amount),
      recipient: {
        name: validation.value.recipient.name,
        identifier: validation.value.recipient.identifier,
      },
      createdAt: new Date().toISOString(),
    },
  };

  recordTransfer(body.idempotencyKey, response.receipt);

  return NextResponse.json(response, { status: 200 });
}
