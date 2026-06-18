import { redirect } from 'next/navigation';

// Legacy multi-step onboarding — superseded by the lightweight /welcome flow.
export default function LegacyOnboardingPage() {
  redirect('/welcome');
}
