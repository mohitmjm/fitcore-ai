import type { Metadata } from 'next';
import { MomentumPageClient } from '@/components/momentum/MomentumPageClient';

export const metadata: Metadata = {
  title: 'Momentum Quests',
  description: 'Readiness-aware daily fitness quests where strength, movement, and recovery count equally.',
  robots: { index: false, follow: false },
};

export default function MomentumPage() {
  return <MomentumPageClient />;
}
