'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Flame, RefreshCw, Share2, ShieldCheck, Sparkles, Trophy, Zap } from 'lucide-react';
import type { MomentumExperience, MomentumQuest } from '@/lib/policy/momentum';
import { MomentumFocusMode } from './MomentumFocusMode';
import { MomentumPath } from './MomentumPath';
import { MomentumQuestCard } from './MomentumQuestCard';
import styles from './momentum.module.css';

type ViewState = 'loading' | 'ready' | 'auth' | 'error';

export function MomentumPageClient() {
  const [view, setView] = useState<ViewState>('loading');
  const [experience, setExperience] = useState<MomentumExperience | null>(null);
  const [activeQuest, setActiveQuest] = useState<MomentumQuest | null>(null);
  const [completing, setCompleting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2200);
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    setView('loading');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const response = await fetch(`/api/v1/momentum?timezone=${encodeURIComponent(timezone)}`, { cache: 'no-store', signal });
      if (response.status === 401) {
        setView('auth');
        return;
      }
      const json = (await response.json()) as { data?: MomentumExperience };
      if (!response.ok || !json.data) throw new Error('Momentum could not load');
      setExperience(json.data);
      setView('ready');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setView('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => {
      controller.abort();
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
    };
  }, [load]);

  async function completeQuest() {
    if (!activeQuest) return;
    setCompleting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const response = await fetch('/api/v1/momentum', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timezone, questId: activeQuest.id }),
      });
      const json = (await response.json()) as { data?: MomentumExperience; error?: { message?: string } };
      if (!response.ok || !json.data) throw new Error(json.error?.message ?? 'Quest could not be completed');
      setExperience(json.data);
      setActiveQuest(null);
      setCelebrating(true);
      if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = window.setTimeout(() => setCelebrating(false), 1800);
      showToast('+12 XP · momentum protected');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Quest could not be completed');
    } finally {
      setCompleting(false);
    }
  }

  async function shareBoost() {
    if (!experience?.crewBoost) return;
    const url = `${window.location.origin}${experience.crewBoost.sharePath}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'A FitCore Momentum Quest', text: experience.crewBoost.text, url });
        showToast('Crew boost ready');
      } else {
        await navigator.clipboard.writeText(`${experience.crewBoost.text} ${url}`);
        showToast('Crew boost copied');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      showToast('Sharing is not available right now');
    }
  }

  async function copyBoost() {
    if (!experience?.crewBoost) return;
    try {
      await navigator.clipboard.writeText(`${experience.crewBoost.text} ${window.location.origin}${experience.crewBoost.sharePath}`);
      showToast('Crew boost copied');
    } catch {
      showToast('Copy is not available right now');
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/today" className={styles.backLink}><ArrowLeft aria-hidden="true" />Today</Link>
        <span className={styles.newPill}><Sparkles aria-hidden="true" />New · healthy streaks</span>
      </header>

      {view === 'loading' ? <div className={styles.loading} aria-label="Loading Momentum Quests"><i /><i /><i /></div> : null}
      {view === 'auth' ? <section className={styles.statePanel}><Zap aria-hidden="true" /><h1>Sign in to build momentum</h1><p>Your quest history and readiness stay tied to your FitCore profile.</p><Link href="/sign-in">Sign in</Link></section> : null}
      {view === 'error' ? <section className={styles.statePanel}><RefreshCw aria-hidden="true" /><h1>Momentum paused</h1><p>Your progress is safe. Try loading today’s choices again.</p><button type="button" onClick={() => void load()}><RefreshCw aria-hidden="true" />Try again</button></section> : null}

      {view === 'ready' && experience ? <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span>FitCore Momentum</span>
            <h1>One quest.<br /><em>Real momentum.</em></h1>
            <p>Pick the action with the lowest friction. Strength, movement, and recovery all count equally.</p>
          </div>
          <div className={styles.streakCard}>
            <span><Flame aria-hidden="true" />Current rhythm</span>
            <strong>{experience.streak.current}<small>day{experience.streak.current === 1 ? '' : 's'}</small></strong>
            <div><span><Trophy aria-hidden="true" />Best {experience.streak.best}</span><span>{experience.streak.activeDaysLast7}/7 active</span></div>
          </div>
        </section>

        <section className={styles.pathSection} aria-labelledby="momentum-path-title">
          <div><span>Your rhythm</span><h2 id="momentum-path-title">The last seven days</h2></div>
          <MomentumPath path={experience.path} />
        </section>

        <section className={styles.coachPulse}>
          <span className={styles.pulseIcon}><Zap aria-hidden="true" /></span>
          <div><small>{experience.coachPulse.eyebrow}</small><h2>{experience.coachPulse.title}</h2><p>{experience.coachPulse.message}</p></div>
          <span className={styles.readinessChip}>{experience.readiness.score !== undefined ? `${experience.readiness.score} ready` : 'Balanced default'}</span>
        </section>

        {experience.completedToday ? <section className={`${styles.completed} ${celebrating ? styles.celebrating : ''}`} aria-labelledby="momentum-complete-title">
          <div className={styles.completeMark}><Check aria-hidden="true" /></div>
          <div className={styles.completeCopy}>
            <span>Today is protected</span>
            <h2 id="momentum-complete-title">{experience.completedToday.title}</h2>
            <p>{experience.completedToday.durationMinutes} minutes · +{experience.completedToday.xpReward} XP · {experience.completedToday.kind} counted</p>
          </div>
          {experience.crewBoost ? <div className={styles.boostCard}>
            <div><span>Crew boost</span><p>{experience.crewBoost.text}</p></div>
            <button type="button" onClick={() => void shareBoost()}><Share2 aria-hidden="true" />Share</button>
            <button type="button" onClick={() => void copyBoost()} aria-label="Copy crew boost"><Copy aria-hidden="true" /></button>
          </div> : null}
        </section> : <section className={styles.questSection} aria-labelledby="momentum-quests-title">
          <div className={styles.sectionHeading}>
            <div><span>Choose your lane</span><h2 id="momentum-quests-title">Today’s three quests</h2></div>
            <p>One completion earns the day. There is nothing extra to grind.</p>
          </div>
          <div className={styles.questGrid}>
            {experience.quests.map((quest) => <MomentumQuestCard key={quest.id} quest={quest} onStart={setActiveQuest} />)}
          </div>
        </section>}

        <aside className={styles.guardrail}>
          <ShieldCheck aria-hidden="true" />
          <div><strong>Built for return, not compulsion.</strong><p>One quest per day. Recovery earns equal XP. Missed days stay neutral—there are no shame alerts or paid streak repairs.</p></div>
        </aside>
      </main> : null}

      {activeQuest ? <MomentumFocusMode quest={activeQuest} completing={completing} onClose={() => setActiveQuest(null)} onComplete={() => void completeQuest()} /> : null}
      {toast ? <div className={styles.toast} role="status"><Check aria-hidden="true" />{toast}</div> : null}
    </div>
  );
}
