import { NextResponse } from 'next/server';
import type { MovementsResponse } from '@/core/api/contracts';
import { getMovements } from '@/mocks/state';
import { simulateDelay } from '@/mocks/utils';

export async function GET() {
  await simulateDelay(800);
  const response: MovementsResponse = {
    items: getMovements(),
    nextCursor: null,
  };
  return NextResponse.json(response);
}
