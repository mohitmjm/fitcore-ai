'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Volume2, VolumeX, X } from 'lucide-react';
import type { MomentumQuest } from '@/lib/policy/momentum';
import styles from './momentum.module.css';

interface MomentumFocusModeProps {
  quest: MomentumQuest;
  completing: boolean;
  onClose: () => void;
  onComplete: () => void;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function MomentumFocusMode({ quest, completing, onClose, onComplete }: MomentumFocusModeProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setVoiceAvailable('speechSynthesis' in window);
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => {
      window.clearInterval(timer);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  function changeStep(nextIndex: number) {
    const safeIndex = Math.min(quest.steps.length - 1, Math.max(0, nextIndex));
    setStepIndex(safeIndex);
    if (voiceEnabled) speak(quest.steps[safeIndex]);
  }

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next) speak(`${quest.coachCue} ${quest.steps[stepIndex]}`);
    else window.speechSynthesis?.cancel();
  }

  return (
    <div className={styles.focusBackdrop} role="presentation">
      <section ref={dialogRef} tabIndex={-1} className={styles.focusMode} role="dialog" aria-modal="true" aria-labelledby="momentum-focus-title">
        <div className={styles.focusTop}>
          <span>Quest in progress</span>
          <strong aria-label={`${elapsedSeconds} seconds elapsed`}>{formatElapsed(elapsedSeconds)}</strong>
          <button type="button" onClick={onClose} aria-label="Close quest focus mode"><X aria-hidden="true" /></button>
        </div>

        <div className={styles.focusProgress} aria-label={`Step ${stepIndex + 1} of ${quest.steps.length}`}>
          {quest.steps.map((step, index) => <i key={step} className={index <= stepIndex ? styles.focusProgressActive : ''} />)}
        </div>

        <div className={styles.focusContent}>
          <span className={styles.focusKind}>{quest.kind} · {quest.durationMinutes} min</span>
          <h2 id="momentum-focus-title">{quest.title}</h2>
          <p className={styles.focusCue}>{quest.coachCue}</p>
          <div className={styles.currentStep} aria-live="polite">
            <small>Step {stepIndex + 1}</small>
            <strong>{quest.steps[stepIndex]}</strong>
          </div>
        </div>

        <div className={styles.focusStepControls}>
          <button type="button" onClick={() => changeStep(stepIndex - 1)} disabled={stepIndex === 0} aria-label="Previous quest step"><ChevronLeft aria-hidden="true" /></button>
          {voiceAvailable ? <button type="button" onClick={toggleVoice} aria-pressed={voiceEnabled}>{voiceEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}{voiceEnabled ? 'Voice on' : 'Coach voice'}</button> : <span>Read each cue at your pace</span>}
          <button type="button" onClick={() => changeStep(stepIndex + 1)} disabled={stepIndex === quest.steps.length - 1} aria-label="Next quest step"><ChevronRight aria-hidden="true" /></button>
        </div>

        <button type="button" className={styles.completeButton} onClick={onComplete} disabled={completing}>
          <Check aria-hidden="true" />{completing ? 'Saving your win…' : 'Complete today’s quest'}
        </button>
        <p className={styles.safetyNote}>Stop if anything hurts or you feel unwell. This is general fitness guidance, not medical advice.</p>
      </section>
    </div>
  );
}
