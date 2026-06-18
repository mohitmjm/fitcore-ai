import { redirect } from 'next/navigation';

// Legacy Supabase login route — superseded by Clerk. Redirect to the Clerk sign-in page.
export default function LegacyLoginPage() {
  redirect('/sign-in');
}
