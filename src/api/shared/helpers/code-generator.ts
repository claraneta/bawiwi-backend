/**
 * Generates a random 6-digit code as a string.
 * Includes leading zeros, so the result is always exactly 6 characters long.
 * Range: "000000" to "999999"
 */
export function generateCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}
