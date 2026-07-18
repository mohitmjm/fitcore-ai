'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download, Images, LoaderCircle, Share2, SquareArrowOutUpRight, X } from 'lucide-react';
import type { WeeklyStoryCard, ShareStoryCard } from '@/lib/policy/weekly-story';
import type { WeeklyStorySnapshot } from '@/lib/services/weekly-story/types';
import { ShareCard } from './ShareCard';
import { StoryPrivacySettings } from './StoryPrivacySettings';
import styles from './story.module.css';

interface StoryShareSheetProps {
  story: WeeklyStorySnapshot;
  activeCard: WeeklyStoryCard;
  photoBusy: boolean;
  onClose: () => void;
  onStoryRefresh: (story: WeeklyStorySnapshot) => void;
}

export function StoryShareSheet({ story, activeCard, photoBusy, onClose, onStoryRefresh }: StoryShareSheetProps) {
  const [configuration, setConfiguration] = useState(story.shareConfiguration);
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState('');
  const shareCard = useMemo(() => story.cards.find((card): card is ShareStoryCard => card.type === 'share'), [story.cards]);

  async function record(action: 'share' | 'download' | 'copy') {
    await fetch('/api/v1/weekly-story/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ snapshotId: story.snapshotId, action, configuration }),
    }).catch(() => undefined);
  }

  async function exporter() {
    return import('@/lib/weekly-story/export');
  }

  async function downloadCard(card: WeeklyStoryCard) {
    if (!card.shareSafe) {
      setMessage('This private card stays in the app and is not exported.');
      return;
    }
    setBusy('card');
    try {
      const { renderStoryCardPng, downloadStoryBlob } = await exporter();
      const blob = await renderStoryCardPng(story, card, configuration);
      downloadStoryBlob(blob, `fitcore-${story.weekStart}-${card.id}.png`);
      await record('download');
      setMessage('1080 × 1920 image saved.');
    } catch {
      setMessage('Image export did not finish. Your story is still safe—please retry.');
    } finally {
      setBusy(undefined);
    }
  }

  async function downloadAll() {
    setBusy('all');
    try {
      const { renderStoryCardPng, downloadStoryBlob } = await exporter();
      const safeCards = story.cards.filter((card) => card.shareSafe && card.type !== 'progress_photo');
      for (const card of safeCards) {
        const blob = await renderStoryCardPng(story, card, configuration);
        downloadStoryBlob(blob, `fitcore-${story.weekStart}-${card.id}.png`);
        await new Promise((resolve) => window.setTimeout(resolve, 140));
      }
      await record('download');
      setMessage(`${safeCards.length} privacy-safe story images saved.`);
    } catch {
      setMessage('The image set could not finish. Try the final share card instead.');
    } finally {
      setBusy(undefined);
    }
  }

  async function nativeShare() {
    if (!shareCard) return;
    setBusy('share');
    try {
      const { buildShareSummary, renderStoryCardPng } = await exporter();
      const blob = await renderStoryCardPng(story, shareCard, configuration);
      const file = new File([blob], `fitcore-${story.weekStart}.png`, { type: 'image/png' });
      const text = buildShareSummary(story, configuration);
      if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) throw new Error('Native file sharing unavailable');
      await navigator.share({ title: 'My FitCore week', text, files: [file] });
      await record('share');
      setMessage('Shared from your device.');
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') setMessage('Native sharing is unavailable here. Download or copy the summary instead.');
    } finally {
      setBusy(undefined);
    }
  }

  async function copySummary() {
    setBusy('copy');
    try {
      const { buildShareSummary } = await exporter();
      await navigator.clipboard.writeText(buildShareSummary(story, configuration));
      await record('copy');
      setMessage('Privacy-safe summary copied.');
    } catch {
      setMessage('Copy is unavailable. You can still download the share card.');
    } finally {
      setBusy(undefined);
    }
  }

  async function shareWhatsApp() {
    const { buildShareSummary } = await exporter();
    window.open(`https://wa.me/?text=${encodeURIComponent(buildShareSummary(story, configuration))}`, '_blank', 'noopener,noreferrer');
    await record('share');
  }

  async function updatePhotos(includeProgressPhotos: boolean) {
    setMessage('Updating your private story…');
    try {
      const response = await fetch('/api/v1/weekly-story/regenerate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          weekStart: story.weekStart,
          timezone: story.timezone,
          reason: 'User changed private progress photo preference',
          privacySettings: { includeProgressPhotos },
        }),
      });
      const json = (await response.json()) as { data?: { story?: WeeklyStorySnapshot | null } };
      if (!response.ok || !json.data?.story) throw new Error();
      onStoryRefresh(json.data.story);
      setMessage(includeProgressPhotos ? 'Private comparison added when two eligible photos are available.' : 'Progress photos removed from this story revision.');
    } catch {
      setMessage('The private photo setting could not be updated.');
    }
  }

  if (!shareCard) return null;
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="share-sheet-title">
      <section className={styles.shareSheet}>
        <header><div><Share2 /><span><h2 id="share-sheet-title">Share your week</h2><p>Preview and choose every external detail.</p></span></div><button type="button" onClick={onClose} aria-label="Close share preview"><X /></button></header>
        <div className={styles.shareLayout}>
          <div className={styles.sharePreview}><ShareCard card={shareCard} configuration={configuration} /></div>
          <div className={styles.shareOptions}>
            <StoryPrivacySettings configuration={configuration} includeProgressPhotos={story.privacySettings.includeProgressPhotos} photoBusy={photoBusy} onChange={setConfiguration} onPhotoChange={(include) => void updatePhotos(include)} />
            <div className={styles.shareActions}>
              <button type="button" onClick={nativeShare} disabled={Boolean(busy)}><Share2 />{busy === 'share' ? 'Opening…' : 'Share from device'}</button>
              <button type="button" onClick={() => downloadCard(shareCard)} disabled={Boolean(busy)}><Download />{busy === 'card' ? 'Rendering…' : 'Download share card'}</button>
              <button type="button" onClick={() => downloadCard(activeCard)} disabled={Boolean(busy) || !activeCard.shareSafe}><Images />Download current card</button>
              <button type="button" onClick={downloadAll} disabled={Boolean(busy)}>{busy === 'all' ? <LoaderCircle /> : <Images />}Download safe image set</button>
              <button type="button" onClick={copySummary} disabled={Boolean(busy)}><Copy />Copy summary</button>
              <button type="button" onClick={shareWhatsApp} disabled={Boolean(busy)}><Share2 />Open WhatsApp</button>
            </div>
            <aside className={styles.instagramNote}><SquareArrowOutUpRight /><p><strong>Instagram Stories</strong><span>Download the 1080 × 1920 card, then add it from Instagram. Browsers cannot publish directly to an Instagram Story.</span></p></aside>
            {message ? <p className={styles.shareMessage} role="status"><Check />{message}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
