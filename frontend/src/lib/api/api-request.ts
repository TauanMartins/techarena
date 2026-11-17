import { ApiError } from './api-error';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';
export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      response.ok
        ? 'Não foi possível processar a resposta.'
        : 'Não foi possível concluir a solicitação. Tente novamente.',
      response.status,
    );
  }
  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'Não foi possível concluir a solicitação. Tente novamente.';
    throw new ApiError(message, response.status);
  }
  return body as T;
}
