'use client';

import { ChevronLeft, ChevronRight, Eye, EyeOff, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getExerciseAnimation, interpolatePose, transformFor, type EquipmentId, type ExercisePosture, type JointValue } from '@/lib/exercises/animation';
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
  onRepComplete?: () => void;
}

const segmentTransform = (value: JointValue | undefined) => {
  const pose = transformFor(value);
  return `translate(${pose.translateX} ${pose.translateY}) rotate(${pose.rotation}) scale(${pose.scaleX} ${pose.scaleY})`;
};

function Hand({ side, equipment }: { side: 'left' | 'right'; equipment: EquipmentId[] }) {
  const direction = side === 'left' ? -1 : 1;
  const carriesWeight = equipment.includes('dumbbell') || equipment.includes('dumbbells') || equipment.includes('kettlebell');

  return <g className={`rig-hand rig-hand-${side}`}>
    <ellipse className="rig-palm" cx={direction * 1.5} cy="5" rx="6.8" ry="8.5" transform={`rotate(${direction * -8} ${direction * 1.5} 5)`} />
    <path className="rig-fingers" d={`M${direction * -4.5} 5.5 Q${direction * .5} 12.5 ${direction * 6.5} 8.5 L${direction * 7.5} 4 Q${direction * 1.5} 7 ${direction * -4.5} 2.5Z`} />
    <path className="rig-thumb" d={`M${direction * -4} 0 Q${direction * -9} 2 ${direction * -7} 7 Q${direction * -4} 8 ${direction * -1} 5Z`} />
    {carriesWeight && <g className="rig-dumbbell" transform={`translate(0 7) rotate(${direction * 90})`}>
      <rect className="rig-dumbbell-handle" x="-14" y="-2.5" width="28" height="5" rx="2.5" />
      <rect x="-19" y="-9" width="7" height="18" rx="2.5" />
      <rect x="12" y="-9" width="7" height="18" rx="2.5" />
      <path className="rig-grip-lines" d="M-4 -3V3 M0 -3V3 M4 -3V3" />
    </g>}
  </g>;
}

function Arm({ side, upper, forearm, equipment }: { side: 'left' | 'right'; upper: JointValue | undefined; forearm: JointValue | undefined; equipment: EquipmentId[] }) {
  const direction = side === 'left' ? -1 : 1;
  return <g transform={`translate(${direction * 27} 0)`} className={`rig-arm rig-${side}`}>
    <g transform={segmentTransform(upper)}><path className="rig-upper-arm" d={`M0 0 C${direction * 9} 16 ${direction * 8} 31 ${direction * 3} 48`} /><g transform={`translate(${direction * 3} 48)`}>
      <circle className="rig-joint" r="5" /><g transform={segmentTransform(forearm)}><path className="rig-forearm" d={`M0 0 C${direction * 5} 13 ${direction * 5} 29 ${direction * 2} 41`} /><g transform={`translate(${direction * 2} 41)`}>
        <Hand side={side} equipment={equipment} />
      </g></g>
    </g></g>
  </g>;
}

function Leg({ side, thigh, shin }: { side: 'left' | 'right'; thigh: JointValue | undefined; shin: JointValue | undefined }) {
  const direction = side === 'left' ? -1 : 1;
  return <g transform={`translate(${direction * 16} 20)`} className={`rig-leg rig-${side}`}><g transform={segmentTransform(thigh)}><path className="rig-thigh" d={`M0 0 C${direction * 9} 20 ${direction * 7} 42 ${direction * 2} 61`} /><g transform={`translate(${direction * 2} 61)`}><circle className="rig-joint" r="6" /><g transform={segmentTransform(shin)}><path className="rig-shin" d={`M0 0 C${direction * 3} 17 ${direction * 5} 35 ${direction * 3} 49`} /><g transform={`translate(${direction * 3} 49)`}><path className="rig-foot" d={`M${direction * -6} 0 H${direction * 19} Q${direction * 23} 4 ${direction * 17} 9 H${direction * -7}Z`} /></g></g></g></g></g>;
}

function EquipmentBackdrop({ equipment }: { equipment: EquipmentId[] }) {
  return <g className="rig-equipment" aria-hidden="true">
    {(equipment.includes('floor') || equipment.includes('mat')) && <><rect className="rig-mat" x="35" y="250" width="190" height="23" rx="10" /><path className="rig-floor" d="M22 274H238" /></>}
    {(equipment.includes('bench') || equipment.includes('incline-bench') || equipment.includes('upright-bench')) && <g className="rig-bench"><path d={equipment.includes('incline-bench') ? 'M67 218 L142 143 L152 151 L96 229' : 'M75 210 H186 V221 H75Z'} /><path d="M93 221L78 266 M166 221L183 266" /></g>}
    {equipment.includes('cable-machine') && <g className="rig-cable-machine"><path d="M205 50V251 M183 50H225 M187 251H224" /><circle cx="205" cy="61" r="7" /><path className="rig-cable" d="M205 67 C190 118 176 139 156 154 M205 67 C220 118 204 139 183 154" /><path className="rig-handle" d="M150 153h13 M177 153h13" /><path className="rig-pad" d="M149 192H207" /></g>}
  </g>;
}

function HipBar({ equipment }: { equipment: EquipmentId[] }) {
  if (!equipment.includes('barbell')) return null;
  return <g className="rig-barbell"><path d="M-57 8H57" /><rect x="-50" y="-3" width="10" height="22" rx="2" /><rect x="40" y="-3" width="10" height="22" rx="2" /><rect className="rig-bar-pad" x="-15" y="3" width="30" height="10" rx="5" /></g>;
}

function ResistanceBand({ equipment }: { equipment: EquipmentId[] }) {
  if (!equipment.includes('resistance-band')) return null;
  return <path className="rig-band" d="M83 138 C113 155 147 155 177 138" />;
}

const rootTransformFor = (posture: ExercisePosture) => ({
  standing: 'translate(130 128)',
  incline: 'translate(111 186) rotate(-53)',
  seated: 'translate(130 157)',
  prone: 'translate(126 154) rotate(-90)',
  supine: 'translate(126 174) rotate(-90)',
  side: 'translate(122 186) rotate(-90)',
  quadruped: 'translate(110 180) rotate(-90)',
  row: 'translate(117 183) rotate(30)',
  'hip-thrust': 'translate(95 178) rotate(-90)',
}[posture]);

function HumanRig({ pose, equipment, posture, showMuscles }: { pose: ReturnType<typeof interpolatePose>; equipment: EquipmentId[]; posture: ExercisePosture; showMuscles: boolean }) {
  return <svg className="exercise-avatar" viewBox="0 0 260 300" aria-hidden="true"><EquipmentBackdrop equipment={equipment} /><g className="rig-root" transform={rootTransformFor(posture)}>
    <g transform={segmentTransform(pose.pelvis)}><path className="rig-pelvis" d="M-25 0 Q0 -9 25 0 L21 22 Q0 31 -21 22Z" /><HipBar equipment={equipment} />
      <g transform={segmentTransform(pose.torso)}><path className="rig-lower-torso" d="M-20 -1 Q0 -12 20 -1 L26 -45 Q0 -57 -26 -45Z" /><path className="rig-upper-torso" d="M-26 -43 Q0 -63 26 -43 L31 -76 Q0 -92 -31 -76Z" />
        <g transform="translate(0 -87)"><path className="rig-neck" d="M-7 0H7V12H-7Z" /><ellipse className="rig-head" cx="0" cy="-14" rx="16" ry="20" /><path className="rig-hair" d="M-15 -19 Q0 -42 15 -19V-29Q0 -45 -15 -29Z" /></g>
        <Arm side="left" upper={pose.leftUpperArm} forearm={pose.leftForearm} equipment={equipment} /><Arm side="right" upper={pose.rightUpperArm} forearm={pose.rightForearm} equipment={equipment} />
        {showMuscles && <><path className="rig-muscle muscle-chest" d="M-23 -55Q0 -67 23 -55L19 -42Q0 -35 -19 -42Z" /><path className="rig-muscle muscle-core" d="M-12 -34H12L9 -7Q0 -2 -9 -7Z" /></>}
      </g>
      <Leg side="left" thigh={pose.leftThigh} shin={pose.leftShin} /><Leg side="right" thigh={pose.rightThigh} shin={pose.rightShin} />
    </g>
  </g><ResistanceBand equipment={equipment} /></svg>;
}

export default function ExerciseAnimationPlayer({ exercise, compact = false, autoPlay = true, showControls = true, showMuscles: initialMuscles = true, reducedMotionOverride, paused = false, onRepComplete }: ExerciseAnimationPlayerProps) {
  const animation = useMemo(() => getExerciseAnimation(exercise), [exercise]);
  const rootRef = useRef<HTMLDivElement>(null); const elapsedRef = useRef(0); const callbackRef = useRef(onRepComplete);
  const [playing, setPlaying] = useState(autoPlay); const [speed, setSpeed] = useState(1); const [elapsed, setElapsed] = useState(0);
  const [muscles, setMuscles] = useState(initialMuscles); const [visible, setVisible] = useState(!compact); const [tabVisible, setTabVisible] = useState(true); const [reducedMotion, setReducedMotion] = useState(false); const [reducedIndex, setReducedIndex] = useState(0);
  callbackRef.current = onRepComplete;

  useEffect(() => { elapsedRef.current = 0; setElapsed(0); setReducedIndex(0); setPlaying(autoPlay); }, [animation.id, autoPlay]);
  useEffect(() => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => { setReducedMotion(query.matches); if (query.matches) setPlaying(false); }; update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  useEffect(() => { const node = rootRef.current; if (!node || !compact) return; const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.18 }); observer.observe(node); return () => observer.disconnect(); }, [compact]);
  useEffect(() => { const update = () => setTabVisible(!document.hidden); update(); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);

  const reduced = reducedMotionOverride ?? reducedMotion;
  const canAnimate = playing && !paused && !reduced && visible && tabVisible;
  useEffect(() => {
    if (!canAnimate) return;
    let frame = 0; let last = performance.now(); let lastPaint = last;
    const tick = (now: number) => { const delta = now - last; last = now; elapsedRef.current += delta * speed; if (now - lastPaint >= 48) { setElapsed(elapsedRef.current); lastPaint = now; } if (elapsedRef.current >= animation.duration) { elapsedRef.current %= animation.duration; callbackRef.current?.(); } frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [animation.duration, canAnimate, speed]);

  const progress = reduced ? reducedIndex / Math.max(1, animation.reducedMotionFrames.length - 1) : (elapsed % animation.duration) / animation.duration;
  const pose = reduced ? animation.reducedMotionFrames[reducedIndex] : interpolatePose(animation, progress);
  const phaseIndex = reduced ? Math.min(animation.phases.length - 1, Math.round(progress * (animation.phases.length - 1))) : Math.min(animation.phases.length - 1, Math.floor(progress * animation.phases.length));
  const phase = animation.phases[phaseIndex];
  const status = paused ? 'Resting' : reduced ? 'Reduced motion' : !visible ? 'Paused off-screen' : !tabVisible ? 'Paused in background' : playing ? 'Playing' : 'Paused';

  return <div ref={rootRef} className={`exercise-animation-player svg-animation-player ${compact ? 'is-compact' : ''}`} data-animation-state={status.toLocaleLowerCase().replaceAll(' ', '-')} role="group" aria-label={`Animated ${exercise.name} demonstration. Current phase: ${phase}. ${status}.`}>
    <HumanRig pose={pose} equipment={animation.equipment} posture={animation.posture} showMuscles={muscles} />
    {!compact && <><div className="animation-phase"><strong>{phase}</strong><span>{Math.round(progress * 100)}% · {status}</span></div><div className="animation-progress" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></div></>}
    {showControls && !compact && <div className="animation-controls"><button type="button" onClick={() => setPlaying((value) => !value)} disabled={reduced} aria-label={playing ? 'Pause animation' : 'Play animation'}>{playing ? <Pause /> : <Play />}</button><button type="button" onClick={() => { elapsedRef.current = 0; setElapsed(0); setReducedIndex(0); }} aria-label="Replay animation"><RotateCcw /></button>
      {reduced ? <><button type="button" onClick={() => setReducedIndex((value) => Math.max(0, value - 1))} disabled={reducedIndex === 0}><ChevronLeft />Previous</button><button type="button" onClick={() => setReducedIndex((value) => Math.min(animation.reducedMotionFrames.length - 1, value + 1))} disabled={reducedIndex === animation.reducedMotionFrames.length - 1}>Next<ChevronRight /></button></> : <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Animation speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option></select>}
      <button type="button" className={muscles ? 'active' : ''} onClick={() => setMuscles((value) => !value)}>{muscles ? <Eye /> : <EyeOff />}Muscles</button></div>}
  </div>;
}
