const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

/** "$367.50". Accepts numeric strings because Postgres numeric columns can arrive as text. */
export function money(n: number | string): string {
  return cad.format(Number(n))
}
