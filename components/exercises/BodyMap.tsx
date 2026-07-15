'use client';

import { useState } from 'react';
import { MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { MuscleId } from '@/lib/exercises/types';

interface BodyMapProps {
  view: 'front' | 'back';
  gender: 'male' | 'female';
  selected: MuscleId[];
  onToggle: (muscle: MuscleId) => void;
}

function Region({
  id,
  selected,
  onToggle,
  onHover,
  children,
}: {
  id: MuscleId;
  selected: boolean;
  onToggle: (id: MuscleId) => void;
  onHover: (id: MuscleId | null) => void;
  children: React.ReactNode;
}) {
  const muscle = MUSCLE_BY_ID[id];
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${muscle.label}, ${muscle.scientificName}`}
      aria-pressed={selected}
      className={`muscle-region ${selected ? 'is-selected' : ''}`}
      onClick={() => onToggle(id)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(id);
        }
      }}
    >
      {children}
    </g>
  );
}

export default function BodyMap({ view, gender, selected, onToggle }: BodyMapProps) {
  const [hovered, setHovered] = useState<MuscleId | null>(null);
  const activeLabel = hovered ? MUSCLE_BY_ID[hovered] : selected[0] ? MUSCLE_BY_ID[selected[0]] : null;
  const female = gender === 'female';

  return (
    <div className="body-map-wrap">
      <svg
        viewBox="0 0 280 560"
        className="body-map-svg"
        role="group"
        aria-label={`${gender} anatomical ${view} view. Select a highlighted muscle region.`}
      >
        <defs>
          <linearGradient id={`body-base-${view}-${gender}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#30363d" />
            <stop offset="1" stopColor="#171b20" />
          </linearGradient>
        </defs>

        <g className="body-silhouette" fill={`url(#body-base-${view}-${gender})`} stroke="#4a525c" strokeWidth="1.5">
          <circle cx="140" cy="45" r={female ? 29 : 31} />
          <path d="M126 72 L124 91 L156 91 L154 72 Q140 80 126 72Z" />
          <path
            d={
              female
                ? 'M112 88 C92 96 84 126 88 166 L102 236 C106 254 108 278 102 304 L121 321 L140 310 L159 321 L178 304 C172 278 174 254 178 236 L192 166 C196 126 188 96 168 88 C156 98 124 98 112 88Z'
                : 'M105 88 C82 98 79 130 86 168 L99 236 C103 258 105 281 100 304 L120 320 L140 310 L160 320 L180 304 C175 281 177 258 181 236 L194 168 C201 130 198 98 175 88 C160 99 120 99 105 88Z'
            }
          />
          <path d={female ? 'M92 111 C72 138 68 188 64 238 C62 269 57 296 51 325 L67 330 C78 299 83 269 87 236 C92 193 100 151 112 126Z' : 'M89 108 C67 134 63 185 60 236 C58 269 53 299 47 328 L65 333 C76 301 81 269 84 236 C88 190 99 145 111 123Z'} />
          <path d={female ? 'M188 111 C208 138 212 188 216 238 C218 269 223 296 229 325 L213 330 C202 299 197 269 193 236 C188 193 180 151 168 126Z' : 'M191 108 C213 134 217 185 220 236 C222 269 227 299 233 328 L215 333 C204 301 199 269 196 236 C192 190 181 145 169 123Z'} />
          <path d={female ? 'M104 302 C91 326 91 361 96 404 L103 510 L128 510 L133 405 L140 318 L121 314Z' : 'M101 302 C87 326 89 366 94 406 L101 510 L128 510 L133 405 L140 318 L120 312Z'} />
          <path d={female ? 'M176 302 C189 326 189 361 184 404 L177 510 L152 510 L147 405 L140 318 L159 314Z' : 'M179 302 C193 326 191 366 186 406 L179 510 L152 510 L147 405 L140 318 L160 312Z'} />
          <path d="M99 506 L96 537 L126 537 L128 506Z" />
          <path d="M181 506 L184 537 L154 537 L152 506Z" />
        </g>

        {view === 'front' ? (
          <g>
            <Region id="shoulders" selected={selected.includes('shoulders')} onToggle={onToggle} onHover={setHovered}>
              <ellipse cx="101" cy="116" rx="18" ry="20" /><ellipse cx="179" cy="116" rx="18" ry="20" />
            </Region>
            <Region id="front-deltoids" selected={selected.includes('front-deltoids')} onToggle={onToggle} onHover={setHovered}>
              <path d="M89 111 Q101 96 113 110 L109 137 Q98 143 89 128Z" /><path d="M191 111 Q179 96 167 110 L171 137 Q182 143 191 128Z" />
            </Region>
            <Region id="side-deltoids" selected={selected.includes('side-deltoids')} onToggle={onToggle} onHover={setHovered}>
              <path d="M85 114 Q94 101 99 109 L93 143 Q85 145 80 135Z" /><path d="M195 114 Q186 101 181 109 L187 143 Q195 145 200 135Z" />
            </Region>
            <Region id="upper-chest" selected={selected.includes('upper-chest')} onToggle={onToggle} onHover={setHovered}>
              <path d="M112 105 Q126 98 138 107 L137 129 Q121 127 108 118Z" /><path d="M168 105 Q154 98 142 107 L143 129 Q159 127 172 118Z" />
            </Region>
            <Region id="chest" selected={selected.includes('chest')} onToggle={onToggle} onHover={setHovered}>
              <path d="M107 121 Q122 128 138 131 L136 166 Q118 171 103 157Z" /><path d="M173 121 Q158 128 142 131 L144 166 Q162 171 177 157Z" />
            </Region>
            <Region id="biceps" selected={selected.includes('biceps')} onToggle={onToggle} onHover={setHovered}>
              <ellipse cx="79" cy="172" rx="10" ry="27" transform="rotate(6 79 172)" /><ellipse cx="201" cy="172" rx="10" ry="27" transform="rotate(-6 201 172)" />
            </Region>
            <Region id="forearms" selected={selected.includes('forearms')} onToggle={onToggle} onHover={setHovered}>
              <path d="M68 205 Q79 203 78 218 L66 288 Q61 299 55 288Z" /><path d="M212 205 Q201 203 202 218 L214 288 Q219 299 225 288Z" />
            </Region>
            <Region id="upper-abs" selected={selected.includes('upper-abs')} onToggle={onToggle} onHover={setHovered}>
              <rect x="124" y="172" width="14" height="48" rx="6" /><rect x="142" y="172" width="14" height="48" rx="6" />
            </Region>
            <Region id="lower-abs" selected={selected.includes('lower-abs')} onToggle={onToggle} onHover={setHovered}>
              <path d="M124 223 H138 V279 Q130 286 122 276Z" /><path d="M142 223 H156 L158 276 Q150 286 142 279Z" />
            </Region>
            <Region id="obliques" selected={selected.includes('obliques')} onToggle={onToggle} onHover={setHovered}>
              <path d="M104 169 Q118 174 120 188 L118 265 Q107 252 102 221Z" /><path d="M176 169 Q162 174 160 188 L162 265 Q173 252 178 221Z" />
            </Region>
            <Region id="hip-flexors" selected={selected.includes('hip-flexors')} onToggle={onToggle} onHover={setHovered}>
              <path d="M112 268 Q125 275 135 290 L122 318 Q108 306 106 288Z" /><path d="M168 268 Q155 275 145 290 L158 318 Q172 306 174 288Z" />
            </Region>
            <Region id="abductors" selected={selected.includes('abductors')} onToggle={onToggle} onHover={setHovered}>
              <path d="M101 287 Q111 288 120 315 L111 353 Q98 341 95 314Z" /><path d="M179 287 Q169 288 160 315 L169 353 Q182 341 185 314Z" />
            </Region>
            <Region id="adductors" selected={selected.includes('adductors')} onToggle={onToggle} onHover={setHovered}>
              <path d="M126 311 Q136 320 137 341 L130 402 L115 361Z" /><path d="M154 311 Q144 320 143 341 L150 402 L165 361Z" />
            </Region>
            <Region id="quadriceps" selected={selected.includes('quadriceps')} onToggle={onToggle} onHover={setHovered}>
              <path d="M106 323 Q122 318 132 341 L126 410 Q115 430 103 405 L98 352Z" /><path d="M174 323 Q158 318 148 341 L154 410 Q165 430 177 405 L182 352Z" />
            </Region>
            <Region id="calves" selected={selected.includes('calves')} onToggle={onToggle} onHover={setHovered}>
              <path d="M101 425 Q118 416 125 440 L122 494 Q108 506 101 484Z" /><path d="M179 425 Q162 416 155 440 L158 494 Q172 506 179 484Z" />
            </Region>
          </g>
        ) : (
          <g>
            <Region id="traps" selected={selected.includes('traps')} onToggle={onToggle} onHover={setHovered}>
              <path d="M124 88 Q140 99 156 88 L165 134 L140 159 L115 134Z" />
            </Region>
            <Region id="rear-deltoids" selected={selected.includes('rear-deltoids')} onToggle={onToggle} onHover={setHovered}>
              <path d="M89 111 Q103 98 116 111 L108 142 Q95 144 86 130Z" /><path d="M191 111 Q177 98 164 111 L172 142 Q185 144 194 130Z" />
            </Region>
            <Region id="side-deltoids" selected={selected.includes('side-deltoids')} onToggle={onToggle} onHover={setHovered}>
              <path d="M84 116 Q91 105 98 111 L92 143 Q83 145 79 134Z" /><path d="M196 116 Q189 105 182 111 L188 143 Q197 145 201 134Z" />
            </Region>
            <Region id="triceps" selected={selected.includes('triceps')} onToggle={onToggle} onHover={setHovered}>
              <path d="M74 143 Q88 139 88 158 L80 205 Q69 211 67 191Z" /><path d="M206 143 Q192 139 192 158 L200 205 Q211 211 213 191Z" />
            </Region>
            <Region id="forearms" selected={selected.includes('forearms')} onToggle={onToggle} onHover={setHovered}>
              <path d="M68 207 Q79 202 78 220 L66 289 Q60 298 55 286Z" /><path d="M212 207 Q201 202 202 220 L214 289 Q220 298 225 286Z" />
            </Region>
            <Region id="upper-back" selected={selected.includes('upper-back')} onToggle={onToggle} onHover={setHovered}>
              <path d="M112 126 Q140 153 168 126 L164 177 Q140 190 116 177Z" />
            </Region>
            <Region id="lats" selected={selected.includes('lats')} onToggle={onToggle} onHover={setHovered}>
              <path d="M105 143 Q119 162 119 190 L112 241 Q98 223 96 180Z" /><path d="M175 143 Q161 162 161 190 L168 241 Q182 223 184 180Z" />
            </Region>
            <Region id="lower-back" selected={selected.includes('lower-back')} onToggle={onToggle} onHover={setHovered}>
              <path d="M119 187 Q140 198 161 187 L159 264 Q140 279 121 264Z" />
            </Region>
            <Region id="abductors" selected={selected.includes('abductors')} onToggle={onToggle} onHover={setHovered}>
              <path d="M104 265 Q116 265 127 286 L117 324 Q101 315 98 292Z" /><path d="M176 265 Q164 265 153 286 L163 324 Q179 315 182 292Z" />
            </Region>
            <Region id="glutes" selected={selected.includes('glutes')} onToggle={onToggle} onHover={setHovered}>
              <path d="M113 275 Q130 276 138 290 L135 326 Q117 340 101 318Z" /><path d="M167 275 Q150 276 142 290 L145 326 Q163 340 179 318Z" />
            </Region>
            <Region id="hamstrings" selected={selected.includes('hamstrings')} onToggle={onToggle} onHover={setHovered}>
              <path d="M102 327 Q119 326 132 343 L126 411 Q111 426 101 404 L96 355Z" /><path d="M178 327 Q161 326 148 343 L154 411 Q169 426 179 404 L184 355Z" />
            </Region>
            <Region id="calves" selected={selected.includes('calves')} onToggle={onToggle} onHover={setHovered}>
              <path d="M100 425 Q117 414 125 441 L120 494 Q108 506 99 484Z" /><path d="M180 425 Q163 414 155 441 L160 494 Q172 506 181 484Z" />
            </Region>
          </g>
        )}
      </svg>

      <div className="body-map-caption" aria-live="polite">
        {activeLabel ? (
          <><strong>{activeLabel.label}</strong><span>{activeLabel.scientificName}</span></>
        ) : (
          <><strong>Select a muscle</strong><span>Tap the body or use the list below</span></>
        )}
      </div>
    </div>
  );
}
