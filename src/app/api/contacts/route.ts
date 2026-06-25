import { NextResponse } from 'next/server';
import type {
  ContactsResponse,
  CreateContactRequest,
  CreateContactResponse,
} from '@/core/api/contracts';
import { newContactSchema } from '@/features/transactions/schema';
import { MOCK_CONTACTS } from '@/mocks/data';
import { simulateDelay, mockId } from '@/mocks/utils';

// En memoria durante la sesión del servidor (suficiente para el mock)
const contacts = [...MOCK_CONTACTS];

export async function GET() {
  await simulateDelay(500);
  const response: ContactsResponse = { contacts };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  await simulateDelay(600);

  const body: CreateContactRequest = await request.json();
  const parsed = newContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 422 },
    );
  }

  const newContact = {
    id: `contact-${mockId()}`,
    name: parsed.data.name,
    identifier: parsed.data.identifier,
    isFavorite: false,
  };

  contacts.push(newContact);

  const response: CreateContactResponse = { contact: newContact };
  return NextResponse.json(response, { status: 201 });
}
