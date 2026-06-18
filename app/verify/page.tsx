import { redirect } from 'next/navigation';

// Legacy Supabase email-verification route — Clerk handles verification in its own flow.
export default function LegacyVerifyPage() {
  redirect('/sign-in');
}
