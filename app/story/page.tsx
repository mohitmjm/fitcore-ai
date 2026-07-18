import type { Metadata } from 'next';
import { StoryRouteClient } from './StoryRouteClient';

export const metadata: Metadata = {
  title: 'Weekly Story',
  description: 'Your private FitCore weekly consistency story.',
  robots: { index: false, follow: false, nocache: true },
};

export default function StoryPage() {
  return <StoryRouteClient />;
}
