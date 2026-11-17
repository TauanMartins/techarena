export function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}
