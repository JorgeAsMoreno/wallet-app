import { NextResponse } from 'next/server';
import type { AccountResponse } from '@/core/api/contracts';
import { MOCK_ACCOUNT } from '@/mocks/data';
import { simulateDelay } from '@/mocks/utils';

export async function GET() {
  await simulateDelay(600);
  const response: AccountResponse = { account: MOCK_ACCOUNT };
  return NextResponse.json(response);
}
