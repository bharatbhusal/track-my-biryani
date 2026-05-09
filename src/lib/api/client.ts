import type { ApiRequestOptions, ApiResponse } from '@/types/api.types';

class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

function getPath(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }

  return path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(getPath(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Request failed' : payload.error.message;
    const code = payload.success ? undefined : payload.error.code;
    throw new ApiClientError(message, response.status, code);
  }

  return payload.data;
}

export { ApiClientError };
