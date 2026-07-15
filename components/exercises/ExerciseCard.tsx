'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck, Dumbbell, Plus, ArrowUpRight, Play } from 'lucide-react';
import { MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { Exercise } from '@/lib/exercises/types';
import MovementDemo from './MovementDemo';

export default function ExerciseCard({
  exercise,
  saved,
  saving,
  onSave,
  onAdd,
  onPlay,
}: {
  exercise: Exercise;
  saved: boolean;
  saving?: boolean;
  onSave: () => void;
  onAdd: () => void;
  onPlay?: (exercise: Exercise) => void;
}) {
  return (
    <article className="exercise-card">
      <button type="button" className="exercise-card-media" onClick={() => onPlay?.(exercise)} aria-label={`Play ${exercise.name} video`}>
        <MovementDemo exercise={exercise} compact />
        <span className="exercise-level">{exercise.difficulty}</span>
        <span className="exercise-card-play"><Play fill="currentColor" />Play</span>
      </button>
      <div className="exercise-card-body">
        <div className="exercise-card-topline">
          <span>{MUSCLE_BY_ID[exercise.primaryMuscles[0]].label}</span>
          <span>•</span>
          <span>{exercise.equipment[0]}</span>
        </div>
        <Link href={`/exercises/${exercise.slug}`} className="exercise-title-link">
          <h3>{exercise.name}</h3><ArrowUpRight aria-hidden="true" />
        </Link>
        <p>{exercise.description}</p>
        <div className="exercise-tags">
          <span>{exercise.trainingType}</span>
          <span>{exercise.locations.join(' + ')}</span>
        </div>
        <div className="exercise-card-actions">
          <button type="button" className="button-secondary icon-button" onClick={onSave} disabled={saving} aria-label={saved ? `Remove ${exercise.name} from saved exercises` : `Save ${exercise.name}`}>
            {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          </button>
          <button type="button" className="button-primary add-button" onClick={onAdd}>
            <Plus aria-hidden="true" /><span>Add to workout</span><Dumbbell aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
