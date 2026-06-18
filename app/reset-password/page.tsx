import { redirect } from 'next/navigation';

// Legacy Supabase password-reset route — Clerk handles password reset in its own flow.
export default function LegacyResetPasswordPage() {
  redirect('/sign-in');
}
