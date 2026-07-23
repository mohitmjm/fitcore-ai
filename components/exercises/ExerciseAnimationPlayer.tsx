'use client';

import { ChevronLeft, ChevronRight, Eye, EyeOff, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AnatomicalExerciseRig from '@/components/exercises/AnatomicalExerciseRig';
import { getExerciseAnimation, interpolatePose } from '@/lib/exercises/animation';
import type { Exercise } from '@/lib/exercises/types';

type Preview = Pick<Exercise, 'name'> & Partial<Pick<Exercise, 'slug'>>;

export interface ExerciseAnimationPlayerProps {
  exercise: Preview;
  compact?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  showMuscles?: boolean;
  reducedMotionOverride?: boolean;
  paused?: boolean;
  staticPose?: 'setup' | 'active';
  debugJoints?: boolean;
  onRepComplete?: () => void;
}

export default function ExerciseAnimationPlayer({ exercise, compact = false, autoPlay = true, showControls = true, showMuscles: initialMuscles = true, reducedMotionOverride, paused = false, staticPose, debugJoints = false, onRepComplete }: ExerciseAnimationPlayerProps) {
  const animation = useMemo(() => getExerciseAnimation(exercise), [exercise]);
  const rootRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const callbackRef = useRef(onRepComplete);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [muscles, setMuscles] = useState(initialMuscles);
  const [visible, setVisible] = useState(!compact);
  const [tabVisible, setTabVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedIndex, setReducedIndex] = useState(0);
  callbackRef.current = onRepComplete;

  useEffect(() => {
    elapsedRef.current = 0;
    setElapsed(0);
    setReducedIndex(0);
    setPlaying(autoPlay);
  }, [animation.id, autoPlay]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(query.matches);
      if (query.matches) setPlaying(false);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !compact) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.18 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [compact]);

  useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  const reduced = reducedMotionOverride ?? reducedMotion;
  const canAnimate = playing && !paused && !reduced && !staticPose && visible && tabVisible;
  useEffect(() => {
    if (!canAnimate) return;
    let frame = 0;
    let last = performance.now();
    let lastPaint = last;
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      elapsedRef.current += delta * speed;
      if (now - lastPaint >= 48) {
        setElapsed(elapsedRef.current);
        lastPaint = now;
      }
      if (elapsedRef.current >= animation.duration) {
        elapsedRef.current %= animation.duration;
        callbackRef.current?.();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animation.duration, canAnimate, speed]);

  const staticIndex = staticPose === 'active' ? animation.reducedMotionFrames.length - 1 : 0;
  const progress = staticPose ? staticIndex / Math.max(1, animation.reducedMotionFrames.length - 1) : reduced ? reducedIndex / Math.max(1, animation.reducedMotionFrames.length - 1) : (elapsed % animation.duration) / animation.duration;
  const pose = staticPose ? animation.reducedMotionFrames[staticIndex] : reduced ? animation.reducedMotionFrames[reducedIndex] : interpolatePose(animation, progress);
  const phaseIndex = staticPose || reduced ? Math.min(animation.phases.length - 1, Math.round(progress * (animation.phases.length - 1))) : Math.min(animation.phases.length - 1, Math.floor(progress * animation.phases.length));
  const phase = animation.phases[phaseIndex];
  const status = staticPose ? `Static ${staticPose}` : paused ? 'Resting' : reduced ? 'Reduced motion' : !visible ? 'Paused off-screen' : !tabVisible ? 'Paused in background' : playing ? 'Playing' : 'Paused';

  return <div ref={rootRef} className={`exercise-animation-player svg-animation-player ${compact ? 'is-compact' : ''}`} data-animation-state={status.toLocaleLowerCase().replaceAll(' ', '-')} data-exercise-slug={animation.slug} role="group" aria-label={`Animated ${exercise.name} demonstration. Current phase: ${phase}. ${status}.`}>
    <AnatomicalExerciseRig animation={animation} pose={pose} compact={compact} showMuscles={muscles} debugJoints={debugJoints} />
    {!compact && <><div className="animation-phase"><strong>{phase}</strong><span>{Math.round(progress * 100)}% · {status}</span></div><div className="animation-progress" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></div></>}
    {showControls && !compact && !staticPose && <div className="animation-controls"><button type="button" onClick={() => setPlaying((value) => !value)} disabled={reduced} aria-label={playing ? 'Pause animation' : 'Play animation'}>{playing ? <Pause /> : <Play />}</button><button type="button" onClick={() => { elapsedRef.current = 0; setElapsed(0); setReducedIndex(0); }} aria-label="Replay animation"><RotateCcw /></button>
      {reduced ? <><button type="button" onClick={() => setReducedIndex((value) => Math.max(0, value - 1))} disabled={reducedIndex === 0}><ChevronLeft />Previous</button><button type="button" onClick={() => setReducedIndex((value) => Math.min(animation.reducedMotionFrames.length - 1, value + 1))} disabled={reducedIndex === animation.reducedMotionFrames.length - 1}>Next<ChevronRight /></button></> : <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Animation speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option></select>}
      <button type="button" className={muscles ? 'active' : ''} onClick={() => setMuscles((value) => !value)}>{muscles ? <Eye /> : <EyeOff />}Muscles</button></div>}
  </div>;
}
