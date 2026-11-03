import { vi, type Mock } from 'vitest';

type ApiFunction = (...args: never[]) => Promise<unknown>;

export function spyOnApiMethod<T extends object, K extends keyof T>(
  service: T,
  method: K,
) {
  const value = service[method];
  if (typeof value !== 'function') {
    throw new TypeError(`API method ${String(method)} is not a function.`);
  }
  return vi.spyOn(service as Record<string, ApiFunction>, String(method)) as Mock<ApiFunction>;
}

export function apiError(status: number, message = 'Request failed') {
  return Object.assign(new Error(message), { status, response: { status, data: { message } } });
}
