import { ApiErrorSchema } from '@bulir-challenges/api-contracts';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3400/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  body?: unknown;
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);
    throw new ApiError(errorBody.message, response.status, errorBody.details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function parseErrorBody(response: Response): Promise<{ message: string; details?: string[] }> {
  try {
    const body = (await response.json()) as unknown;
    const parsed = ApiErrorSchema.safeParse(body);

    if (parsed.success) {
      const message = Array.isArray(parsed.data.message)
        ? parsed.data.message[0] ?? `Request failed (${parsed.data.statusCode})`
        : parsed.data.message;

      return {
        message,
        details: Array.isArray(parsed.data.message) ? parsed.data.message : undefined,
      };
    }
  } catch {
    // Keep fallback message.
  }

  return { message: `Request failed with status ${response.status}` };
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
