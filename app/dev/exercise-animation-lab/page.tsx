'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import ExerciseAnimationPlayer from '@/components/exercises/ExerciseAnimationPlayer';
import { EXERCISES } from '@/lib/exercises/catalog';

const STATIC_POSES = [
  { label: 'Standing neutral', slug: 'dumbbell-lateral-raise', pose: 'setup' },
  { label: 'Seated neutral', slug: 'seated-wrist-curl', pose: 'setup' },
  { label: 'Lying on bench', slug: 'incline-dumbbell-press', pose: 'setup' },
  { label: 'High plank', slug: 'push-up', pose: 'setup' },
  { label: 'Bottom push-up', slug: 'push-up', pose: 'active' },
  { label: 'Quadruped', slug: 'bird-dog', pose: 'setup' },
  { label: 'Side plank', slug: 'side-plank', pose: 'active' },
  { label: 'Bottom squat', slug: 'goblet-squat', pose: 'active' },
  { label: 'Hip hinge', slug: 'dumbbell-romanian-deadlift', pose: 'active' },
  { label: 'Hip-thrust lockout', slug: 'hip-thrust', pose: 'active' },
  { label: 'Overhead press setup', slug: 'seated-dumbbell-shoulder-press', pose: 'setup' },
  { label: 'Lat-pulldown setup', slug: 'neutral-grip-lat-pulldown', pose: 'setup' },
] as const;

export default function ExerciseAnimationLab() {
  const [light, setLight] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [featuredSlug, setFeaturedSlug] = useState(EXERCISES[0].slug);
  const [resting, setResting] = useState(false);
  const [debugJoints, setDebugJoints] = useState(false);
  const [cataloguePose, setCataloguePose] = useState<'active'>();
  const featured = EXERCISES.find((exercise) => exercise.slug === featuredSlug) ?? EXERCISES[0];

  if (process.env.NODE_ENV === 'production') notFound();

  return <main className={light ? 'light animation-lab' : 'animation-lab'}>
    <header className="animation-lab-header"><div><p>Development-only visual check</p><h1>Exercise animation lab</h1><span>All 22 catalogue movements use the production SVG player.</span></div><div><button type="button" onClick={() => setLight((value) => !value)}>{light ? 'Dark mode' : 'Light mode'}</button><button type="button" onClick={() => setReducedMotion((value) => !value)}>{reducedMotion ? 'Motion on' : 'Reduced motion'}</button><button type="button" onClick={() => setCataloguePose((value) => value ? undefined : 'active')}>{cataloguePose ? 'Animate all' : 'Freeze active poses'}</button><button type="button" onClick={() => setDebugJoints((value) => !value)}>{debugJoints ? 'Hide pivots' : 'Show pivots'}</button><button type="button" onClick={() => setResting((value) => !value)}>{resting ? 'Resume workout' : 'Simulate rest'}</button></div></header>
    <section className="animation-lab-featured"><label className="animation-lab-select"><span>Full-player exercise</span><select value={featured.slug} onChange={(event) => setFeaturedSlug(event.target.value)} aria-label="Featured exercise">{EXERCISES.map((exercise) => <option key={exercise.slug} value={exercise.slug}>{exercise.name}</option>)}</select></label><ExerciseAnimationPlayer exercise={featured} reducedMotionOverride={reducedMotion} paused={resting} debugJoints={debugJoints} /></section>
    <section className="animation-lab-pose-grid" aria-label="Static anatomical pose checks">{STATIC_POSES.map((item) => { const exercise = EXERCISES.find((candidate) => candidate.slug === item.slug) ?? EXERCISES[0]; return <article key={`${item.label}-${item.pose}`}><header><strong>{item.label}</strong><span>{item.pose}</span></header><ExerciseAnimationPlayer exercise={exercise} compact autoPlay={false} showControls={false} staticPose={item.pose} debugJoints={debugJoints} /></article>; })}</section>
    <section className="animation-lab-grid">{EXERCISES.map((exercise) => <article key={exercise.slug}><header><strong>{exercise.name}</strong><code>{exercise.slug}</code></header><ExerciseAnimationPlayer exercise={exercise} compact reducedMotionOverride={reducedMotion} staticPose={cataloguePose} debugJoints={debugJoints} /></article>)}</section>
  </main>;
}
