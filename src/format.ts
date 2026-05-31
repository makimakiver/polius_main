/** Format a wallet address as `0x1234…cdef`. Inputs ≤ 10 chars pass through. */
export function shortAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
