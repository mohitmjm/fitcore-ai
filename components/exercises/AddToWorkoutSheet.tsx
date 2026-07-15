'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Exercise } from '@/lib/exercises/types';

type Target = 'today' | 'existing' | 'new';

export default function AddToWorkoutSheet({
  exercise,
  onClose,
  onSuccess,
}: {
  exercise: Exercise;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [target, setTarget] = useState<Target>('today');
  const [targetName, setTargetName] = useState("Today's workout");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10');
  const [weightKg, setWeightKg] = useState('');
  const [restSeconds, setRestSeconds] = useState(60);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function selectTarget(next: Target) {
    setTarget(next);
    setTargetName(next === 'today' ? "Today's workout" : next === 'existing' ? 'Current plan' : 'My custom workout');
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/v1/workout-builder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          target,
          targetName,
          sets,
          reps,
          weightKg: weightKg ? Number(weightKg) : undefined,
          restSeconds,
          notes: notes || undefined,
        }),
      });
      const json = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(json.error?.message ?? 'Could not add this exercise.');
      onSuccess(`${exercise.name} added to ${targetName}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this exercise.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="workout-sheet" role="dialog" aria-modal="true" aria-labelledby="add-workout-title">
        <div className="sheet-handle" />
        <header className="sheet-header">
          <div><span className="eyebrow">Configure exercise</span><h2 id="add-workout-title">Add {exercise.name}</h2></div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close"><X /></button>
        </header>

        <div className="target-switch" aria-label="Workout destination">
          {([['today', 'Today'], ['existing', 'Current plan'], ['new', 'New workout']] as const).map(([value, label]) => (
            <button type="button" key={value} className={target === value ? 'active' : ''} onClick={() => selectTarget(value)}>
              {target === value && <Check aria-hidden="true" />}{label}
            </button>
          ))}
        </div>

        {target === 'new' && (
          <label className="field"><span>Workout name</span><input value={targetName} onChange={(event) => setTargetName(event.target.value)} /></label>
        )}

        <div className="workout-config-grid">
          <label className="field"><span>Sets</span><input type="number" min="1" max="12" value={sets} onChange={(event) => setSets(Number(event.target.value))} /></label>
          <label className="field"><span>Reps</span><input value={reps} onChange={(event) => setReps(event.target.value)} /></label>
          <label className="field"><span>Weight (kg)</span><input type="number" min="0" step="0.5" placeholder="Optional" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} /></label>
          <label className="field"><span>Rest (sec)</span><input type="number" min="0" max="900" value={restSeconds} onChange={(event) => setRestSeconds(Number(event.target.value))} /></label>
        </div>
        <label className="field"><span>Notes</span><textarea rows={3} placeholder="Tempo, setup, or coaching cue" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="button" className="button-primary sheet-submit" onClick={submit} disabled={busy || !targetName.trim()}>
          {busy ? 'Adding…' : 'Add to workout'}
        </button>
      </section>
    </div>
  );
}
