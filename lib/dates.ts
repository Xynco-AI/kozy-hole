// Parse a 'YYYY-MM-DD' string into a Date at LOCAL midnight built from components
// (avoids UTC parsing that shifts the calendar day). Day-of-week is then the true calendar weekday.
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
// Format a 'YYYY-MM-DD' string for display in Alberta time, e.g. "Fri, Jan 16, 2026".
export function formatDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString('en-CA', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}
