import { NextResponse } from 'next/server';
import { ApiErrorCode, type LoginRequest, type LoginResponse } from '@/core/api/contracts';
import { loginSchema } from '@/features/auth/schema';
import { MOCK_SESSION } from '@/mocks/data';
import { simulateDelay } from '@/mocks/utils';

export async function POST(request: Request) {
  await simulateDelay(1000);

  const body: LoginRequest = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { code: ApiErrorCode.ValidationError, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 422 },
    );
  }

  // Mock: any valid identifier logs in successfully
  const response: LoginResponse = { session: MOCK_SESSION };
  return NextResponse.json(response, { status: 200 });
}
