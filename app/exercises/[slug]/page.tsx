'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, ChevronRight, Clock3, Dumbbell, HeartPulse, Info, Plus, ShieldAlert, Sparkles, Wind } from 'lucide-react';
import AddToWorkoutSheet from '@/components/exercises/AddToWorkoutSheet';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseAnimationPlayer from '@/components/exercises/ExerciseAnimationPlayer';
import { MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { Exercise } from '@/lib/exercises/types';

interface DetailPayload { exercise: Exercise; similar: Exercise[] }

export default function ExerciseDetailPage() {
  const params = useParams<{ slug: string }>();
  const [payload, setPayload] = useState<DetailPayload | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addExercise, setAddExercise] = useState<Exercise | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/v1/exercises/${params.slug}`).then((response) => response.json()),
      fetch('/api/v1/saved-exercises').then((response) => response.json()),
      fetch('/api/v1/profile').then((response) => response.json()),
    ])
      .then(([detail, saved, profile]: [
        { data?: DetailPayload; error?: { message?: string } },
        { data?: { ids?: string[] } },
        { data?: { profile?: { injuries?: string[] } } },
      ]) => {
        if (!active) return;
        if (!detail.data) throw new Error(detail.error?.message ?? 'Exercise not found.');
        setPayload(detail.data);
        setSavedIds(saved.data?.ids ?? []);
        setInjuries(profile.data?.profile?.injuries ?? []);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Exercise could not load.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [params.slug]);

  async function toggleSaved(exercise: Exercise) {
    const saved = savedIds.includes(exercise.id);
    setSavingId(exercise.id);
    setSavedIds((current) => saved ? current.filter((id) => id !== exercise.id) : [...current, exercise.id]);
    try {
      const response = await fetch('/api/v1/saved-exercises', { method: saved ? 'DELETE' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ exerciseId: exercise.id }) });
      if (!response.ok) throw new Error();
      showToast(saved ? 'Removed from saved exercises' : 'Saved for later');
    } catch {
      setSavedIds((current) => saved ? [...current, exercise.id] : current.filter((id) => id !== exercise.id));
      showToast('Could not update saved exercises');
    } finally { setSavingId(null); }
  }

  if (loading) return <ExerciseDetailLoading />;
  if (error || !payload) return <div className="state-panel error-state"><strong>Exercise unavailable</strong><p>{error}</p><Link href="/exercises">Back to exercises</Link></div>;

  const { exercise, similar } = payload;
  const saved = savedIds.includes(exercise.id);
  const aiPrompt = encodeURIComponent(`Explain the correct form for ${exercise.name}. Adapt it to my goal, experience, available equipment and injuries from my Fitcore profile.`);

  return (
    <div className="page-stack exercise-detail-page">
      <Link href="/exercises" className="back-link"><ArrowLeft />Body &amp; Exercises</Link>

      <section className="detail-hero-grid">
        <div className="detail-demo-panel"><ExerciseAnimationPlayer exercise={exercise} /><div className="demo-scrub"><span>Technique media</span><div><i /></div><span>Reviewed assets only</span></div></div>
        <div className="detail-summary">
          <div className="detail-badges"><span>{exercise.difficulty}</span><span>{exercise.category}</span><span>{exercise.trainingType}</span></div>
          <h1>{exercise.name}</h1>
          <p className="detail-description">{exercise.description}</p>
          <div className="muscle-summary-row"><div><small>Primary</small><strong>{exercise.primaryMuscles.map((id) => MUSCLE_BY_ID[id].label).join(', ')}</strong></div><div><small>Secondary</small><strong>{exercise.secondaryMuscles.length ? exercise.secondaryMuscles.map((id) => MUSCLE_BY_ID[id].label).join(', ') : '—'}</strong></div></div>
          <div className="detail-stat-grid"><div><Dumbbell /><span><small>Equipment</small><strong>{exercise.equipment.join(', ')}</strong></span></div><div><Clock3 /><span><small>Working sets</small><strong>{exercise.setsRecommendation}</strong></span></div><div><HeartPulse /><span><small>Rest</small><strong>{exercise.restRecommendation}</strong></span></div></div>
          <div className="detail-actions">
            <button type="button" className="button-primary" onClick={() => setAddExercise(exercise)}><Plus />Add to workout</button>
            <button type="button" className="button-secondary" disabled={savingId === exercise.id} onClick={() => toggleSaved(exercise)}>{saved ? <BookmarkCheck /> : <Bookmark />}{saved ? 'Saved' : 'Save'}</button>
          </div>
          <Link href={`/chat?prompt=${aiPrompt}`} className="ask-ai-row"><span><Sparkles /></span><div><strong>Ask Fitcore AI about this exercise</strong><small>Personalized to your profile and limitations</small></div><ChevronRight /></Link>
        </div>
      </section>

      {injuries.length > 0 && <aside className="injury-note"><ShieldAlert /><div><strong>Train around your limitations</strong><p>Your profile mentions {injuries.join(', ')}. Use a pain-free range and ask Fitcore AI for a suitable alternative. This guidance does not replace medical advice.</p></div><Link href={`/chat?prompt=${encodeURIComponent(`I want to do ${exercise.name}, but my profile lists ${injuries.join(', ')}. Suggest a safer alternative and explain why.`)}`}>Find an alternative</Link></aside>}

      <div className="detail-content-grid">
        <main className="detail-main-content">
          <section className="content-section"><div className="section-title"><span>01</span><div><small>Technique</small><h2>How to perform it</h2></div></div><ol className="instruction-list">{exercise.instructions.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><p>{instruction}</p></li>)}</ol></section>
          <section className="content-section"><div className="section-title"><span>02</span><div><small>Coaching</small><h2>Form that holds up</h2></div></div><div className="coaching-grid"><div className="tip-card positive"><Check /><div><strong>Form cues</strong><ul>{exercise.formTips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div></div><div className="tip-card warning"><Info /><div><strong>Common mistakes</strong><ul>{exercise.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div></div></div></section>
          <section className="content-section"><div className="section-title"><span>03</span><div><small>Safety</small><h2>Move with confidence</h2></div></div><div className="breathing-card"><Wind /><div><strong>Breathing</strong><p>{exercise.breathing}</p></div></div><ul className="safety-list">{exercise.safetyTips.map((tip) => <li key={tip}><ShieldAlert />{tip}</li>)}</ul></section>
        </main>
        <aside className="detail-side-content">
          <section className="prescription-card"><span className="eyebrow">Recommended dose</span><h2>Start here</h2><dl><div><dt>Sets</dt><dd>{exercise.setsRecommendation}</dd></div><div><dt>Reps</dt><dd>{exercise.repsRecommendation}</dd></div><div><dt>Rest</dt><dd>{exercise.restRecommendation}</dd></div></dl><button type="button" className="button-primary" onClick={() => setAddExercise(exercise)}>Use this setup</button></section>
          <section className="variation-card"><span className="eyebrow">Scale the movement</span><div><small>Make it easier</small><strong>{exercise.easierVariation}</strong></div><div><small>Make it harder</small><strong>{exercise.harderVariation}</strong></div><Link href={`/chat?prompt=${encodeURIComponent(`Replace ${exercise.name} with a ${injuries.length ? 'safer ' : ''}home alternative using equipment from my profile.`)}`}>Ask for a home alternative <ChevronRight /></Link></section>
        </aside>
      </div>

      {similar.length > 0 && <section className="similar-section"><div className="section-heading-row"><div><span className="eyebrow">Keep exploring</span><h2>Similar movements</h2></div><Link href={`/exercises?muscle=${exercise.primaryMuscles[0]}`}>View all <ChevronRight /></Link></div><div className="exercise-grid">{similar.map((item) => <ExerciseCard key={item.id} exercise={item} saved={savedIds.includes(item.id)} saving={savingId === item.id} onSave={() => toggleSaved(item)} onAdd={() => setAddExercise(item)} />)}</div></section>}

      <div className="mobile-detail-cta"><button type="button" className="button-secondary" onClick={() => toggleSaved(exercise)} aria-label={saved ? 'Unsave exercise' : 'Save exercise'}>{saved ? <BookmarkCheck /> : <Bookmark />}</button><button type="button" className="button-primary" onClick={() => setAddExercise(exercise)}><Plus />Add to workout</button></div>
      {addExercise && <AddToWorkoutSheet exercise={addExercise} onClose={() => setAddExercise(null)} onSuccess={showToast} />}
      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
    </div>
  );
}

function ExerciseDetailLoading() {
  return <div className="page-stack"><div className="skeleton-block skeleton-heading" /><div className="detail-hero-grid"><div className="skeleton-block skeleton-detail-media" /><div className="skeleton-block skeleton-detail-copy" /></div></div>;
}
