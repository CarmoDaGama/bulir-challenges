const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'https://bulir-challenges-bhkx.onrender.com/api';

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
  });

  if (!response.ok) {
    const parsed = await parseErrorBody(response);
    throw new ApiError(parsed.message, response.status, parsed.details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function parseErrorBody(response: Response): Promise<{ message: string; details?: string[] }> {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      statusCode?: number;
    };

    if (Array.isArray(body.message)) {
      return {
        message: body.message[0] ?? `Request failed (${response.status})`,
        details: body.message,
      };
    }

    if (typeof body.message === 'string') {
      return { message: body.message };
    }
  } catch {
    // Keep fallback message.
  }

  return { message: `Request failed with status ${response.status}` };
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
