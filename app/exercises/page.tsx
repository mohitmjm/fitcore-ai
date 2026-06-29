'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Dumbbell,
  ListFilter,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from 'lucide-react';

interface Exercise {
  slug: string;
  name: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  movementPattern: string;
  instructions: string[];
  coachTip: string;
}

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'] as const;

function uniqueValues(exercises: Exercise[], field: 'targetMuscles' | 'equipment'): string[] {
  return Array.from(new Set(exercises.flatMap((exercise) => exercise[field]))).sort();
}

export default function ExercisesPage() {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/exercises')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: { exercises?: Exercise[] } } | null) => {
        if (active) setAllExercises(json?.data?.exercises ?? []);
      })
      .catch(() => {
        if (active) setAllExercises([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const muscles = useMemo(() => uniqueValues(allExercises, 'targetMuscles'), [allExercises]);
  const equipmentOptions = useMemo(() => uniqueValues(allExercises, 'equipment'), [allExercises]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      const haystack = [
        exercise.name,
        exercise.movementPattern,
        exercise.coachTip,
        ...exercise.targetMuscles,
        ...exercise.equipment,
      ]
        .join(' ')
        .toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (muscle === 'all' || exercise.targetMuscles.includes(muscle)) &&
        (equipment === 'all' || exercise.equipment.includes(equipment)) &&
        (difficulty === 'all' || exercise.difficulty === difficulty)
      );
    });
  }, [allExercises, difficulty, equipment, muscle, query]);

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
            <Dumbbell className="h-8 w-8 text-cyan-400" />
            Exercise{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Library
            </span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-gray-400">
            Search the starter catalog by muscle, equipment, and difficulty before regenerating plans.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <Stat label="Exercises" value={String(allExercises.length)} />
          <Stat label="Muscles" value={String(muscles.length)} />
          <Stat label="Equipment" value={String(equipmentOptions.length)} />
        </div>
      </div>

      <section className="glass-panel rounded-2xl p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movement, muscle, cue"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0e14] pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </label>

          <FilterSelect icon={Target} value={muscle} onChange={setMuscle} label="Muscle">
            <option value="all">All muscles</option>
            {muscles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect icon={SlidersHorizontal} value={equipment} onChange={setEquipment} label="Equipment">
            <option value="all">All equipment</option>
            {equipmentOptions.map((item) => (
              <option key={item} value={item}>
                {item.replace('_', ' ')}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect icon={ListFilter} value={difficulty} onChange={(v) => setDifficulty(v as typeof difficulty)} label="Difficulty">
            {DIFFICULTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>
        </div>
      </section>

      {!loaded ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-52 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-sm text-gray-400">
          No exercises match those filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((exercise) => (
            <article key={exercise.slug} className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{exercise.name}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    {exercise.movementPattern} · {exercise.difficulty}
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                  <Activity className="h-5 w-5" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {exercise.targetMuscles.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
                {exercise.equipment.map((item) => (
                  <Tag key={item}>{item.replace('_', ' ')}</Tag>
                ))}
              </div>

              <ol className="space-y-2 text-sm text-gray-300">
                {exercise.instructions.map((step, index) => (
                  <li key={step} className="flex gap-2 leading-relaxed">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-cyan-300">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="flex gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-xs text-emerald-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p>{exercise.coachTip}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-gray-300">
      {children}
    </span>
  );
}

function FilterSelect({
  children,
  icon: Icon,
  label,
  value,
  onChange,
}: {
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0b0e14] pl-9 pr-3 text-sm capitalize text-white outline-none focus:border-cyan-500"
      >
        {children}
      </select>
    </label>
  );
}
