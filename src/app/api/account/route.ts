import { NextResponse } from 'next/server';
import type { AccountResponse } from '@/core/api/contracts';
import { getAccount } from '@/mocks/state';
import { simulateDelay } from '@/mocks/utils';

export async function GET() {
  await simulateDelay(600);
  const response: AccountResponse = { account: getAccount() };
  return NextResponse.json(response);
}
