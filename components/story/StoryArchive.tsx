'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, History, LoaderCircle, X } from 'lucide-react';
import type { WeeklyStoryHistoryItem, WeeklyStoryHistoryPage, WeeklyStorySnapshot } from '@/lib/services/weekly-story/types';
import styles from './story.module.css';

interface StoryArchiveProps {
  onClose: () => void;
  onSelect: (story: WeeklyStorySnapshot) => void;
}

export function StoryArchive({ onClose, onSelect }: StoryArchiveProps) {
  const [items, setItems] = useState<WeeklyStoryHistoryItem[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    setError(false);
    try {
      const query = new URLSearchParams({ limit: '8' });
      if (nextCursor) query.set('cursor', nextCursor);
      const response = await fetch(`/api/v1/weekly-story/history?${query}`, { cache: 'no-store' });
      const json = (await response.json()) as { data?: WeeklyStoryHistoryPage };
      if (!response.ok || !json.data) throw new Error();
      setItems((current) => nextCursor ? [...current, ...json.data!.items] : json.data!.items);
      setCursor(json.data.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function openStory(item: WeeklyStoryHistoryItem) {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/weekly-story?weekStart=${item.weekStart}&timezone=${encodeURIComponent(item.timezone)}`, { cache: 'no-store' });
      const json = (await response.json()) as { data?: { story?: WeeklyStorySnapshot | null } };
      if (!response.ok || !json.data?.story) throw new Error();
      onSelect(json.data.story);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="archive-title">
      <section className={styles.archivePanel}>
        <header><div><span><History /></span><h2 id="archive-title">Your weekly archive</h2><p>Frozen snapshots of the weeks you lived—not recalculated history.</p></div><button type="button" onClick={onClose} aria-label="Close archive"><X /></button></header>
        {items.length === 0 && !loading && !error ? <div className={styles.archiveEmpty}><CalendarDays /><strong>Your archive starts with your first active week.</strong><p>Keep checking in and the story will take shape.</p></div> : null}
        <div className={styles.archiveList}>
          {items.map((story) => <button type="button" key={story.snapshotId} onClick={() => void openStory(story)}>
            <span><small>{new Date(`${story.weekStart}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' })} – {new Date(`${story.weekEnd}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</small><strong>{story.standout ?? 'A week of showing up'}</strong><em>{story.viewedAt ? 'Viewed' : 'New'}</em></span>
            <span><b>{story.consistencyPct}%</b><small>Level {story.level}</small></span><ArrowRight />
          </button>)}
        </div>
        {error ? <button className={styles.loadMore} type="button" onClick={() => load(cursor)}>Try loading again</button> : null}
        {loading ? <div className={styles.archiveLoading}><LoaderCircle />Loading stories…</div> : cursor ? <button className={styles.loadMore} type="button" onClick={() => load(cursor)}>Load older stories</button> : null}
      </section>
    </div>
  );
}
