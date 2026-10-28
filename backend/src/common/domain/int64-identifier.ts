/** Decimal IDs travel as strings to preserve precision across JavaScript and SQL. */
export function isInt64Identifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n
  );
}
