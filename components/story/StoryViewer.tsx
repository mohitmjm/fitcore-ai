'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { WeeklyStorySnapshot } from '@/lib/services/weekly-story/types';
import { clampStoryIndex, storyIndexAfterSwipe } from '@/lib/weekly-story/navigation';
import { StoryCardRenderer } from './StoryCardRenderer';
import { StoryProgress } from './StoryProgress';
import { StoryControls } from './StoryControls';
import { StoryShareSheet } from './StoryShareSheet';
import { StoryArchive } from './StoryArchive';
import styles from './story.module.css';

interface StoryViewerProps {
  story: WeeklyStorySnapshot;
  initialArchive?: boolean;
  initialShare?: boolean;
  onStoryChange: (story: WeeklyStorySnapshot) => void;
}

export function StoryViewer({ story, initialArchive = false, initialShare = false, onStoryChange }: StoryViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [elapsedPct, setElapsedPct] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(initialArchive);
  const [shareOpen, setShareOpen] = useState(initialShare);
  const [announcement, setAnnouncement] = useState('');
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const cards = story.cards;
  const activeCard = cards[activeIndex] ?? cards[0];

  const select = useCallback((index: number) => {
    const safe = clampStoryIndex(index, cards.length);
    setActiveIndex(safe);
    setElapsedPct(0);
    setAnnouncement(`Story card ${safe + 1} of ${cards.length}: ${cards[safe]?.title ?? ''}`);
  }, [cards]);

  const next = useCallback(() => select(activeIndex + 1), [activeIndex, select]);
  const previous = useCallback(() => select(activeIndex - 1), [activeIndex, select]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) setPaused(true);
    const onChange = (event: MediaQueryListEvent) => { if (event.matches) setPaused(true); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    void fetch('/api/v1/weekly-story/viewed', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshotId: story.snapshotId }),
    }).catch(() => undefined);
  }, [story.snapshotId]);

  useEffect(() => {
    if (paused || overviewOpen || archiveOpen || shareOpen || activeIndex >= cards.length - 1) return;
    const timer = window.setInterval(() => {
      setElapsedPct((current) => {
        if (current >= 98.75) {
          window.setTimeout(() => select(activeIndex + 1), 0);
          return 0;
        }
        return current + 1.25;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [activeIndex, archiveOpen, cards.length, overviewOpen, paused, select, shareOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (overviewOpen || archiveOpen || shareOpen) return;
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); setPaused((current) => !current); }
      if (event.key === 'Home') select(0);
      if (event.key === 'End') select(cards.length - 1);
      if (event.key === 'Escape') setOverviewOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [archiveOpen, cards.length, next, overviewOpen, previous, select, shareOpen]);

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    select(storyIndexAfterSwipe(activeIndex, cards.length, dx, dy));
  }

  function chooseArchived(nextStory: WeeklyStorySnapshot) {
    onStoryChange(nextStory);
    setArchiveOpen(false);
    setOverviewOpen(false);
    setActiveIndex(0);
    setElapsedPct(0);
  }

  return (
    <main className={styles.storyPage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={styles.srOnly} aria-live="polite">{announcement}</div>
      <section className={styles.viewer} aria-label="FitCore Weekly Story">
        <StoryProgress count={cards.length} activeIndex={activeIndex} elapsedPct={elapsedPct} onSelect={select} />
        <StoryControls paused={paused} muted={muted} canPrevious={activeIndex > 0} canNext={activeIndex < cards.length - 1} onTogglePause={() => setPaused((current) => !current)} onToggleMute={() => setMuted((current) => !current)} onPrevious={previous} onNext={next} onReplay={() => { select(0); setPaused(false); }} onOverview={() => setOverviewOpen(true)} onArchive={() => setArchiveOpen(true)} onExport={() => setShareOpen(true)} />
        <div key={`${story.snapshotId}-${activeCard.id}`} className={styles.cardStage}>
          <StoryCardRenderer card={activeCard} />
          <button type="button" className={styles.tapPrevious} onClick={previous} disabled={activeIndex === 0} aria-label="Previous story card" />
          <button type="button" className={styles.tapNext} onClick={next} disabled={activeIndex === cards.length - 1} aria-label="Next story card" />
        </div>
      </section>

      {overviewOpen ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="overview-title"><section className={styles.overviewPanel}><header><div><span><Check /></span><h2 id="overview-title">Your week, without animation</h2><p>Every card remains readable as a plain summary.</p></div><button type="button" onClick={() => setOverviewOpen(false)} aria-label="Close story overview"><X /></button></header><ol>{cards.map((card, index) => <li key={card.id}><button type="button" onClick={() => { select(index); setOverviewOpen(false); }}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{card.kicker}</small><strong>{card.title}</strong><p>{card.accessibilitySummary}</p></div></button></li>)}</ol></section></div> : null}
      {archiveOpen ? <StoryArchive onClose={() => setArchiveOpen(false)} onSelect={chooseArchived} /> : null}
      {shareOpen ? <StoryShareSheet story={story} activeCard={activeCard} photoBusy={false} onClose={() => setShareOpen(false)} onStoryRefresh={onStoryChange} /> : null}
    </main>
  );
}
