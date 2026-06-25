import { NextResponse } from 'next/server';
import type { TransferRequest, TransferResponse } from '@/core/api/contracts';
import { cents } from '@/core/money';
import { MOCK_ACCOUNT, MOCK_CONTACTS } from '@/mocks/data';
import { simulateDelay, mockId, pickTransferScenario } from '@/mocks/utils';
import { validateTransfer } from '@/features/transactions/domain/rules';

export async function POST(request: Request) {
  const body: TransferRequest = await request.json();
  const scenario = pickTransferScenario();

  // Timeout: no respondemos, el cliente debe manejar el AbortController
  if (scenario === 'timeout') {
    await simulateDelay(15000);
    return NextResponse.json({ code: 'TIMEOUT', message: 'Tiempo de espera agotado' }, { status: 408 });
  }

  await simulateDelay(1200);

  if (scenario === 'network_error') {
    return NextResponse.json({ code: 'NETWORK_ERROR', message: 'Error de red' }, { status: 503 });
  }

  if (scenario === 'unknown_error') {
    return NextResponse.json({ code: 'UNKNOWN_ERROR', message: 'Error inesperado' }, { status: 500 });
  }

  // --- Validación de negocio en el servidor (defense in depth) ---
  const recipient = MOCK_CONTACTS.find((c) => c.id === body.recipientId) ?? null;

  const validation = validateTransfer({
    amount: cents(body.amount),
    recipient,
    availableBalance: MOCK_ACCOUNT.balance,
  });

  if (!validation.ok) {
    const hasFunds = validation.error.find((e) => e.code === 'INSUFFICIENT_FUNDS');
    if (hasFunds && hasFunds.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Saldo insuficiente',
          available: hasFunds.available,
          requested: hasFunds.requested,
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Datos de transferencia inválidos' },
      { status: 422 },
    );
  }

  // --- Éxito ---
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

  return NextResponse.json(response, { status: 200 });
}
