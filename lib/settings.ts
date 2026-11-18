import { contact } from './content'

/**
 * Where guests send Interac e-transfers. Separate from OWNER_EMAIL (where booking
 * alerts go) so alerts can be redirected without changing payment instructions.
 */
export function etransferEmail(): string {
  return process.env.ETRANSFER_EMAIL || contact.email
}
