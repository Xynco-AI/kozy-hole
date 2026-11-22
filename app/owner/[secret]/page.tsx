import { redirect } from 'next/navigation'

// The old secret-link dashboard (/owner/<OWNER_DASHBOARD_SECRET>) has been retired in
// favour of the email login. Any /owner/<something> link, including old bookmarks and
// old emails, now just goes to the login page. It grants no access by itself.
export default function RetiredSecretLink() {
  redirect('/owner')
}
