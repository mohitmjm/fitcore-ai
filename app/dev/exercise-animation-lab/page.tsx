'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import ExerciseAnimationPlayer from '@/components/exercises/ExerciseAnimationPlayer';
import { EXERCISES } from '@/lib/exercises/catalog';

export default function ExerciseAnimationLab() {
  const [light, setLight] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [featuredSlug, setFeaturedSlug] = useState(EXERCISES[0].slug);
  const [resting, setResting] = useState(false);
  const featured = EXERCISES.find((exercise) => exercise.slug === featuredSlug) ?? EXERCISES[0];

  if (process.env.NODE_ENV === 'production') notFound();

  return <main className={light ? 'light animation-lab' : 'animation-lab'}>
    <header className="animation-lab-header"><div><p>Development-only visual check</p><h1>Exercise animation lab</h1><span>All 22 catalogue movements use the production SVG player.</span></div><div><button type="button" onClick={() => setLight((value) => !value)}>{light ? 'Dark mode' : 'Light mode'}</button><button type="button" onClick={() => setReducedMotion((value) => !value)}>{reducedMotion ? 'Motion on' : 'Reduced motion'}</button><button type="button" onClick={() => setResting((value) => !value)}>{resting ? 'Resume workout' : 'Simulate rest'}</button></div></header>
    <section className="animation-lab-featured"><label className="animation-lab-select"><span>Full-player exercise</span><select value={featured.slug} onChange={(event) => setFeaturedSlug(event.target.value)} aria-label="Featured exercise">{EXERCISES.map((exercise) => <option key={exercise.slug} value={exercise.slug}>{exercise.name}</option>)}</select></label><ExerciseAnimationPlayer exercise={featured} reducedMotionOverride={reducedMotion} paused={resting} /></section>
    <section className="animation-lab-grid">{EXERCISES.map((exercise) => <article key={exercise.slug}><header><strong>{exercise.name}</strong><code>{exercise.slug}</code></header><ExerciseAnimationPlayer exercise={exercise} compact reducedMotionOverride={reducedMotion} /></article>)}</section>
  </main>;
}
