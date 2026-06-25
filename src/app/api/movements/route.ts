import { NextResponse } from 'next/server';
import type { MovementsResponse } from '@/core/api/contracts';
import { MOCK_MOVEMENTS } from '@/mocks/data';
import { simulateDelay } from '@/mocks/utils';

export async function GET() {
  await simulateDelay(800);
  const response: MovementsResponse = {
    items: MOCK_MOVEMENTS,
    nextCursor: null, // mock sin paginación real, pero el contrato la soporta
  };
  return NextResponse.json(response);
}
