'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { Pause, Play, Rabbit, RotateCcw } from 'lucide-react';
import { getExerciseAnimation, type ExerciseAnimationConfig, type MotionTemplate } from '@/lib/exercises/animations';
import { MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { Exercise, MuscleId } from '@/lib/exercises/types';

type MovementExercise = Pick<Exercise, 'name' | 'demoStyle'> & Partial<Pick<Exercise, 'id' | 'slug' | 'primaryMuscles' | 'secondaryMuscles'>>;

function fallbackFor(exercise: MovementExercise): ExerciseAnimationConfig {
  const templateByStyle: Record<Exercise['demoStyle'], MotionTemplate> = {
    push: 'overhead-press', pull: 'row', squat: 'squat', hinge: 'hinge', core: 'dead-bug', raise: 'lateral-raise',
  };
  return {
    exerciseId: exercise.id ?? 'supported-fallback',
    slug: exercise.slug ?? 'supported-fallback',
    template: templateByStyle[exercise.demoStyle],
    movementCategory: exercise.demoStyle === 'core' ? 'core' : exercise.demoStyle === 'raise' ? 'carry' : exercise.demoStyle,
    equipment: [],
    bodyPosition: 'standing',
    cameraAngle: 'three-quarter',
    startPose: { torso: 0, shoulder: 8, elbow: 8, hip: 0, knee: 5, ankle: 0 },
    endPose: { torso: 12, shoulder: 88, elbow: 70, hip: 45, knee: 55, ankle: 10 },
    rangeOfMotion: 'Move through a comfortable, controlled range.',
    tempo: '2-1-2 controlled',
    repetitionDurationMs: 3200,
    primaryMuscles: exercise.primaryMuscles ?? [],
    secondaryMuscles: exercise.secondaryMuscles ?? [],
    equipmentMovement: 'Follow the supported movement pattern.',
    safetyConstraints: ['Stop if you feel sharp pain.'],
    instructionMarkers: ['Set your position', 'Move with control', 'Return smoothly'],
    breathingCue: 'Exhale during the effort and inhale on the return.',
    fallbackAnimation: 'supported-fallback',
  };
}

function muscleLevel(config: ExerciseAnimationConfig, ids: MuscleId[]): 'primary' | 'secondary' | undefined {
  if (ids.some((id) => config.primaryMuscles.includes(id))) return 'primary';
  if (ids.some((id) => config.secondaryMuscles.includes(id))) return 'secondary';
  return undefined;
}

function Patch({ level, className }: { level?: 'primary' | 'secondary'; className: string }) {
  return level ? <path className={`rig-muscle ${className} is-${level}`} d="M0 0h1v1H0z" vectorEffect="non-scaling-stroke" /> : null;
}

export default function MovementDemo({ exercise, compact = false }: { exercise: MovementExercise; compact?: boolean }) {
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const config = useMemo(() => getExerciseAnimation(exercise) ?? fallbackFor(exercise), [exercise]);
  const primary = config.primaryMuscles.map((id) => MUSCLE_BY_ID[id]?.label).filter(Boolean);
  const secondary = config.secondaryMuscles.map((id) => MUSCLE_BY_ID[id]?.label).filter(Boolean);
  const duration = config.repetitionDurationMs * (slow ? 1.65 : 1);
  const style = { '--motion-duration': `${duration}ms` } as CSSProperties;
  const equipment = config.equipment.join(' ').toLowerCase();

  return (
    <div
      className={`movement-demo motion-player motion-${config.template} position-${config.bodyPosition} angle-${config.cameraAngle} ${compact ? 'is-compact' : ''} ${playing ? 'is-playing' : 'is-paused'}`}
      style={style}
      aria-label={`${exercise.name} animated demonstration. ${config.instructionMarkers.join('. ')}.`}
      role={compact ? 'img' : undefined}
    >
      <div className="motion-grid" aria-hidden="true" />
      {!compact && <div className="motion-phase"><span>Start</span><i /><span>Effort</span><i /><span>Return</span></div>}

      <svg className="motion-stage" viewBox="0 0 360 360" aria-hidden="true">
        <defs>
          <linearGradient id={`rig-body-${config.exerciseId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#edf1ec" />
            <stop offset="1" stopColor="#9aa39c" />
          </linearGradient>
          <filter id={`rig-glow-${config.exerciseId}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <ellipse className="motion-shadow" cx="180" cy="316" rx="76" ry="10" />
        <g className="rig" fill={`url(#rig-body-${config.exerciseId})`}>
          {equipment.includes('bench') && <g className="rig-bench"><rect x="122" y="245" width="128" height="15" rx="7" /><path d="M140 258v54M232 258v54" /></g>}
          {equipment.includes('cable') && <g className="rig-machine"><path d="M96 54h168v258M96 54v258" /><path className="rig-cable" d="M180 54v82" /></g>}
          {equipment.includes('band') && <path className="rig-band" d="M132 166 Q180 184 228 166" />}
          {equipment.includes('barbell') && <g className="rig-barbell"><path d="M108 177h144" /><circle cx="102" cy="177" r="15" /><circle cx="258" cy="177" r="15" /></g>}

          <g className="rig-body-group">
            <g className="rig-leg rig-leg-back">
              <path className="rig-limb rig-thigh" d="M169 220 L151 270" />
              <g className="rig-lower-leg">
                <path className="rig-limb rig-calf" d="M151 270 L143 317" />
                <path className="rig-foot" d="M143 317h-22" />
              </g>
            </g>
            <g className="rig-leg rig-leg-front">
              <path className="rig-limb rig-thigh" d="M191 220 L209 270" />
              <g className="rig-lower-leg">
                <path className="rig-limb rig-calf" d="M209 270 L217 317" />
                <path className="rig-foot" d="M217 317h22" />
              </g>
            </g>

            <g className="rig-torso-group">
              <path className="rig-torso" d="M152 127 Q180 115 208 127 L218 214 Q180 231 142 214Z" />
              <Patch level={muscleLevel(config, ['chest', 'upper-chest'])} className="muscle-chest" />
              <Patch level={muscleLevel(config, ['upper-back', 'lats', 'traps', 'lower-back'])} className="muscle-back" />
              <Patch level={muscleLevel(config, ['upper-abs', 'lower-abs', 'obliques'])} className="muscle-core" />
              <Patch level={muscleLevel(config, ['glutes'])} className="muscle-glutes" />
            </g>

            <g className="rig-arm rig-arm-back">
              <path className="rig-limb rig-upper-arm" d="M155 139 L128 184" />
              <g className="rig-lower-arm">
                <path className="rig-limb rig-forearm" d="M128 184 L132 232" />
                <circle className="rig-hand" cx="132" cy="236" r="7" />
                {equipment.includes('dumbbell') && <g className="rig-dumbbell"><path d="M116 236h32" /><rect x="110" y="227" width="8" height="18" rx="3" /><rect x="146" y="227" width="8" height="18" rx="3" /></g>}
              </g>
            </g>
            <g className="rig-arm rig-arm-front">
              <path className="rig-limb rig-upper-arm" d="M205 139 L232 184" />
              <g className="rig-lower-arm">
                <path className="rig-limb rig-forearm" d="M232 184 L228 232" />
                <circle className="rig-hand" cx="228" cy="236" r="7" />
                {equipment.includes('dumbbell') && <g className="rig-dumbbell"><path d="M212 236h32" /><rect x="206" y="227" width="8" height="18" rx="3" /><rect x="242" y="227" width="8" height="18" rx="3" /></g>}
              </g>
            </g>

            <circle className="rig-head" cx="180" cy="91" r="27" />
            <path className="rig-neck" d="M171 116v18h18v-18" />

            <Patch level={muscleLevel(config, ['shoulders', 'front-deltoids', 'side-deltoids', 'rear-deltoids'])} className="muscle-shoulders" />
            <Patch level={muscleLevel(config, ['biceps', 'triceps', 'forearms'])} className="muscle-arms" />
            <Patch level={muscleLevel(config, ['quadriceps', 'hamstrings', 'adductors', 'abductors', 'hip-flexors'])} className="muscle-thighs" />
            <Patch level={muscleLevel(config, ['calves'])} className="muscle-calves" />
          </g>
        </g>
      </svg>

      <div className="motion-rep" aria-hidden="true"><span>01</span><small>demo rep</small></div>
      {compact ? (
        <span className="demo-label">{config.cameraAngle} · {config.template.replaceAll('-', ' ')}</span>
      ) : (
        <>
          <div className="motion-coaching-copy">
            <span>{config.instructionMarkers[1]}</span>
            <small>{config.breathingCue}</small>
          </div>
          <div className="muscle-activation-legend" aria-label="Muscle activation legend">
            <span><i className="activation-primary" />Primary<strong>{primary.join(', ') || 'Target muscles'}</strong></span>
            <span><i className="activation-secondary" />Secondary<strong>{secondary.join(', ') || 'Stabilisers'}</strong></span>
          </div>
          <div className="motion-controls">
            <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause exercise animation' : 'Play exercise animation'}>
              {playing ? <Pause /> : <Play />}{playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className={slow ? 'active' : ''} onClick={() => setSlow((value) => !value)} aria-pressed={slow}>
              <Rabbit />{slow ? 'Slow motion on' : 'Slow motion'}
            </button>
            <span><RotateCcw />{config.tempo}</span>
          </div>
        </>
      )}
    </div>
  );
}
