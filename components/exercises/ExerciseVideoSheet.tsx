'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Dumbbell, X } from 'lucide-react';
import ExerciseVideoPlayer from './ExerciseVideoPlayer';
import { MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { Exercise } from '@/lib/exercises/types';

export default function ExerciseVideoSheet({
  exercise,
  onClose,
  onAdd,
}: {
  exercise: Exercise;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop video-sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="exercise-video-sheet" role="dialog" aria-modal="true" aria-labelledby="exercise-video-title">
        <div className="sheet-handle" />
        <header className="sheet-header">
          <div>
            <span className="eyebrow">{MUSCLE_BY_ID[exercise.primaryMuscles[0]].label} exercise</span>
            <h2 id="exercise-video-title">{exercise.name}</h2>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close video player"><X /></button>
        </header>

        <ExerciseVideoPlayer exercise={exercise} compact />

        <section className="video-sheet-guidance" aria-labelledby="video-sheet-guide-title">
          <div><span className="eyebrow">Quick form guide</span><h3 id="video-sheet-guide-title">Move with control</h3></div>
          <ol>{exercise.instructions.slice(0, 3).map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
          <div className="video-sheet-prescription"><span><small>Sets</small><strong>{exercise.setsRecommendation}</strong></span><span><small>Reps</small><strong>{exercise.repsRecommendation}</strong></span><span><small>Rest</small><strong>{exercise.restRecommendation}</strong></span></div>
        </section>

        <div className="video-sheet-actions">
          <Link className="button-secondary" href={`/exercises/${exercise.slug}`} onClick={onClose}>Full instructions <ChevronRight /></Link>
          <button type="button" className="button-primary" onClick={() => { onClose(); onAdd(exercise); }}><Dumbbell />Add to workout</button>
        </div>
      </section>
    </div>
  );
}
