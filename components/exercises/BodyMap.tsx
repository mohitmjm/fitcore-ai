'use client';

import { useId, useState } from 'react';
import { ANATOMICAL_REGIONS, BODY_CONTOURS, BODY_SILHOUETTES, type BodyGender, type BodyView } from '@/lib/exercises/anatomy';
import { MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { MuscleId } from '@/lib/exercises/types';

interface BodyMapProps {
  view: BodyView;
  gender: BodyGender;
  selected: MuscleId[];
  onSelect: (muscle: MuscleId) => void;
}

function Region({
  id,
  paths,
  selected,
  onSelect,
  onHover,
}: {
  id: MuscleId;
  paths: readonly string[];
  selected: boolean;
  onSelect: (id: MuscleId) => void;
  onHover: (id: MuscleId | null) => void;
}) {
  const muscle = MUSCLE_BY_ID[id];

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Select ${muscle.label}, ${muscle.scientificName}`}
      aria-pressed={selected}
      className={`muscle-region ${selected ? 'is-selected' : ''}`}
      data-muscle={id}
      onClick={() => onSelect(id)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(id);
        }
      }}
    >
      <title>{muscle.label}</title>
      {paths.map((path, index) => <path className="muscle-touch-target" d={path} key={`hit-${index}`} />)}
      {paths.map((path, index) => <path className="muscle-shape" d={path} key={`shape-${index}`} />)}
    </g>
  );
}

export default function BodyMap({ view, gender, selected, onSelect }: BodyMapProps) {
  const [hovered, setHovered] = useState<MuscleId | null>(null);
  const captionId = useId();
  const graphicId = useId().replace(/:/g, '');
  const activeMuscle = hovered ? MUSCLE_BY_ID[hovered] : selected[0] ? MUSCLE_BY_ID[selected[0]] : null;
  const shell = BODY_SILHOUETTES[`${gender}-${view}`];
  const shellGradientId = `body-shell-${graphicId}`;
  const lightGradientId = `body-light-${graphicId}`;
  const hasActiveMuscle = Boolean(activeMuscle);

  return (
    <div className={`body-map-wrap ${hasActiveMuscle ? 'has-active-muscle' : ''}`}>
      <div className="anatomy-stage">
        <div className="anatomy-stage-chrome" aria-hidden="true">
          <span>Tap a muscle</span>
          <span className="anatomy-view-badge">{view}</span>
        </div>
        <span className="anatomy-orbit anatomy-orbit-one" aria-hidden="true" />
        <span className="anatomy-orbit anatomy-orbit-two" aria-hidden="true" />
        <span className="anatomy-axis" aria-hidden="true" />
        <svg
          viewBox="0 0 300 610"
          className={`body-map-svg body-map-svg-${view} body-map-svg-${gender}`}
          role="group"
          aria-label={`${gender} anatomical ${view} body. Each highlighted region can be selected.`}
          aria-describedby={captionId}
        >
          <defs>
            <linearGradient id={shellGradientId} x1="0.12" y1="0" x2="0.88" y2="1">
              <stop offset="0" stopColor="#4f5b54" />
              <stop offset="0.45" stopColor="#26312b" />
              <stop offset="1" stopColor="#121a16" />
            </linearGradient>
            <radialGradient id={lightGradientId} cx="50%" cy="18%" r="72%">
              <stop offset="0" stopColor="#d7ff7b" stopOpacity="0.2" />
              <stop offset="0.45" stopColor="#9fc761" stopOpacity="0.055" />
              <stop offset="1" stopColor="#101412" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="body-silhouette" fill={`url(#${shellGradientId})`}>
            {shell.map((path, index) => <path d={path} key={index} />)}
          </g>
          <path className="body-light" d="M93 103 C116 83 184 83 207 103 L209 310 C194 329 106 329 91 310Z" fill={`url(#${lightGradientId})`} aria-hidden="true" />
          <g className="body-contours" aria-hidden="true">
            {BODY_CONTOURS[view].map((path, index) => <path d={path} key={index} />)}
          </g>
          <g className="anatomical-regions">
            {ANATOMICAL_REGIONS[view].map((region) => (
              <Region
                key={region.id}
                id={region.id}
                paths={region.paths}
                selected={selected.includes(region.id)}
                onSelect={onSelect}
                onHover={setHovered}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="body-map-caption" id={captionId} aria-live="polite">
        {activeMuscle ? (
          <><span className="caption-kicker">Target selected</span><strong>{activeMuscle.label}</strong><span>{activeMuscle.scientificName}</span></>
        ) : (
          <><span className="caption-kicker">Interactive anatomy</span><strong>Choose your focus</strong><span>Tap the body or choose a region by name</span></>
        )}
      </div>
    </div>
  );
}
