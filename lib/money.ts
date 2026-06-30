/** All money is integer Algerian dinars (DZD). No subunit. */

export function formatDZD(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} DA`;
}
