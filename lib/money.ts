/** All money is integer Algerian dinars (DZD). No subunit. */

export function formatDZD(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} DA`;
}

/** Arabic-numeral formatting for the bilingual UI. */
export function formatDZDar(amount: number): string {
  return `${amount.toLocaleString("ar-DZ")} دج`;
}
