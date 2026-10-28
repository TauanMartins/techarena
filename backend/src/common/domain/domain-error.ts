export class DomainError extends Error {
  constructor(
    readonly kind: 'invalid' | 'not_found' | 'conflict' | 'forbidden',
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
