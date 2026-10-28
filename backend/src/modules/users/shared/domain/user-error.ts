export class UserError extends Error {
  constructor(
    readonly kind: 'invalid' | 'not_found' | 'conflict',
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
