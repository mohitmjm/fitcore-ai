'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { WeeklyStorySnapshot } from '@/lib/services/weekly-story/types';
import { StoryViewer } from './StoryViewer';
import styles from './story.module.css';

type ViewState = 'loading' | 'ready' | 'forming' | 'error' | 'auth';

export function StoryPageClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ViewState>('loading');
  const [story, setStory] = useState<WeeklyStorySnapshot | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const query = new URLSearchParams();
      const requestedWeek = searchParams.get('weekStart');
      if (requestedWeek) query.set('weekStart', requestedWeek);
      else query.set('period', searchParams.get('period') === 'current' ? 'current' : 'previous');
      query.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
      const response = await fetch(`/api/v1/weekly-story?${query}`, { cache: 'no-store' });
      if (response.status === 401) { setState('auth'); return; }
      const json = (await response.json()) as { data?: { story?: WeeklyStorySnapshot | null } };
      if (!response.ok || !json.data) throw new Error();
      if (!json.data.story) { setState('forming'); return; }
      setStory(json.data.story);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [searchParams]);

  useEffect(() => { void load(); }, [load]);

  if (state === 'loading') return <main className={styles.storyState}><LoaderCircle /><strong>Building your week…</strong><p>FitCore is checking real activity, consistency, and earned progress.</p></main>;
  if (state === 'auth') return <main className={styles.storyState}><Sparkles /><strong>Sign in to see your private story</strong><p>Weekly stories are scoped to your FitCore profile.</p><Link href="/sign-in">Sign in</Link></main>;
  if (state === 'forming') return <main className={styles.storyState}><Sparkles /><strong>Your first story is taking shape</strong><p>Keep checking in—one real activity is enough to begin an honest weekly story.</p><Link href="/today"><ArrowLeft />Back to Today</Link></main>;
  if (state === 'error' || !story) return <main className={styles.storyState}><RefreshCw /><strong>Your story could not load</strong><p>Your data is safe. Try again when your connection is steady.</p><button type="button" onClick={load}><RefreshCw />Try again</button><Link href="/today"><ArrowLeft />Back to Today</Link></main>;
  return <StoryViewer story={story} initialArchive={searchParams.get('archive') === '1'} initialShare={searchParams.get('share') === '1'} onStoryChange={(nextStory) => { setStory(nextStory); setState('ready'); }} />;
}
