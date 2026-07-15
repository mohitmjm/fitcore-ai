import type { Exercise } from '@/lib/exercises/types';

export default function MovementDemo({ exercise, compact = false }: { exercise: Pick<Exercise, 'name' | 'demoStyle'>; compact?: boolean }) {
  return (
    <div className={`movement-demo movement-${exercise.demoStyle} ${compact ? 'is-compact' : ''}`} aria-label={`Illustrated movement preview for ${exercise.name}`} role="img">
      <div className="demo-orbit" />
      <div className="demo-person">
        <span className="demo-head" />
        <span className="demo-torso" />
        <span className="demo-arm demo-arm-left" />
        <span className="demo-arm demo-arm-right" />
        <span className="demo-leg demo-leg-left" />
        <span className="demo-leg demo-leg-right" />
      </div>
      <span className="demo-floor" />
      <span className="demo-label">Form preview</span>
    </div>
  );
}
