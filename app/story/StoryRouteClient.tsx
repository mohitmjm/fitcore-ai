'use client';

import dynamic from 'next/dynamic';

const StoryExperience = dynamic(
  () => import('@/components/story/StoryPageClient').then((module) => module.StoryPageClient),
  { ssr: false, loading: () => <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#090b0b', color: '#f7f8f2' }}>Preparing your Weekly Story…</main> },
);

export function StoryRouteClient() {
  return <StoryExperience />;
}
