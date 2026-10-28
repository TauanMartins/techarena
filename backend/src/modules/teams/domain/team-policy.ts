import { DomainError } from '../../../common/domain/domain-error.js';
export function assertMembershipDecision(
  kind: 'invitation' | 'request',
  actor: string,
  target: string,
  isCaptain: boolean,
): void {
  if (
    (kind === 'request' && !isCaptain) ||
    (kind === 'invitation' && actor !== target)
  )
    throw new DomainError(
      'forbidden',
      'WRONG_APPROVER',
      'Only the receiving party can decide this membership request',
    );
}
