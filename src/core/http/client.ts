/**
 * Wrapper de fetch con:
 * - Timeout via AbortController
 * - Tipado de respuesta genérico
 * - Normalización de errores HTTP a excepciones tipadas
 */

import { ApiErrorCode } from '@/core/api/contracts';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly body: unknown = undefined,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Error de conexión');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('Tiempo de espera agotado');
    this.name = 'TimeoutError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
}

export async function httpClient<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeoutMs = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new HttpError(
        response.status,
        errorBody.code ?? ApiErrorCode.HttpError,
        errorBody.message ?? `HTTP ${response.status}`,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof HttpError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TimeoutError();
    }

    throw new NetworkError();
  }
}
