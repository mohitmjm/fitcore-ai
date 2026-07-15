'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Filter, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import AddToWorkoutSheet from '@/components/exercises/AddToWorkoutSheet';
import BodyMap from '@/components/exercises/BodyMap';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import { EQUIPMENT_OPTIONS } from '@/lib/exercises/catalog';
import { MUSCLES, MUSCLE_BY_ID } from '@/lib/exercises/muscles';
import type { Exercise, ExerciseCategory, ExerciseDifficulty, MuscleId } from '@/lib/exercises/types';

interface ExerciseResponse {
  data?: { items: Exercise[]; total: number };
  error?: { message?: string };
}

type LocationFilter = '' | 'home' | 'gym';
type TypeFilter = '' | 'compound' | 'isolation';

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function FilterPanel({
  equipment,
  difficulty,
  categories,
  location,
  trainingType,
  onEquipment,
  onDifficulty,
  onCategory,
  onLocation,
  onTrainingType,
  onReset,
}: {
  equipment: string[];
  difficulty: ExerciseDifficulty[];
  categories: ExerciseCategory[];
  location: LocationFilter;
  trainingType: TypeFilter;
  onEquipment: (value: string) => void;
  onDifficulty: (value: ExerciseDifficulty) => void;
  onCategory: (value: ExerciseCategory) => void;
  onLocation: (value: LocationFilter) => void;
  onTrainingType: (value: TypeFilter) => void;
  onReset: () => void;
}) {
  return (
    <div className="filter-panel-content">
      <div className="filter-panel-title"><span>Refine exercises</span><button type="button" onClick={onReset}><RotateCcw />Reset</button></div>
      <fieldset className="filter-group"><legend>Workout location</legend><div className="segmented-list">
        {([['', 'Any'], ['home', 'Home'], ['gym', 'Gym']] as const).map(([value, label]) => <button type="button" key={label} onClick={() => onLocation(value)} className={location === value ? 'active' : ''}>{location === value && <Check />}{label}</button>)}
      </div></fieldset>
      <fieldset className="filter-group"><legend>Equipment</legend><div className="filter-check-list">
        {EQUIPMENT_OPTIONS.map((item) => <button type="button" key={item} onClick={() => onEquipment(item)} className={equipment.includes(item) ? 'active' : ''}><span className="filter-check">{equipment.includes(item) && <Check />}</span>{item}</button>)}
      </div></fieldset>
      <fieldset className="filter-group"><legend>Difficulty</legend><div className="filter-pills">
        {(['beginner', 'intermediate', 'advanced'] as ExerciseDifficulty[]).map((item) => <button type="button" key={item} onClick={() => onDifficulty(item)} className={difficulty.includes(item) ? 'active' : ''}>{item}</button>)}
      </div></fieldset>
      <fieldset className="filter-group"><legend>Goal</legend><div className="filter-pills">
        {(['strength', 'hypertrophy', 'mobility', 'stretching'] as ExerciseCategory[]).map((item) => <button type="button" key={item} onClick={() => onCategory(item)} className={categories.includes(item) ? 'active' : ''}>{item}</button>)}
      </div></fieldset>
      <fieldset className="filter-group"><legend>Exercise type</legend><div className="segmented-list">
        {([['', 'Any'], ['compound', 'Compound'], ['isolation', 'Isolation']] as const).map(([value, label]) => <button type="button" key={label} onClick={() => onTrainingType(value)} className={trainingType === value ? 'active' : ''}>{trainingType === value && <Check />}{label}</button>)}
      </div></fieldset>
    </div>
  );
}

export default function ExercisesPage() {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleId[]>([]);
  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [location, setLocation] = useState<LocationFilter>('');
  const [trainingType, setTrainingType] = useState<TypeFilter>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addExercise, setAddExercise] = useState<Exercise | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState('');

  const activeFilterCount = equipment.length + difficulty.length + categories.length + (location ? 1 : 0) + (trainingType ? 1 : 0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    selectedMuscles.forEach((item) => params.append('muscle', item));
    equipment.forEach((item) => params.append('equipment', item));
    difficulty.forEach((item) => params.append('difficulty', item));
    categories.forEach((item) => params.append('category', item));
    if (location) params.set('location', location);
    if (trainingType) params.set('type', trainingType);
    params.set('limit', '48');
    return params.toString();
  }, [categories, difficulty, equipment, location, search, selectedMuscles, trainingType]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const valid = new Set(MUSCLES.map((muscle) => muscle.id));
    const fromUrl = params.getAll('muscle').flatMap((value) => value.split(',')).filter((value): value is MuscleId => valid.has(value as MuscleId));
    if (fromUrl.length) setSelectedMuscles([...new Set(fromUrl)]);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/saved-exercises')
      .then((response) => response.json())
      .then((json: { data?: { ids?: string[] } }) => active && setSavedIds(json.data?.ids ?? []))
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/v1/exercises?${queryString}`, { signal: controller.signal });
        const json = (await response.json()) as ExerciseResponse;
        if (!response.ok || !json.data) throw new Error(json.error?.message ?? 'Could not load exercises.');
        setExercises(json.data.items);
        setTotal(json.data.total);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(err instanceof Error ? err.message : 'Could not load exercises.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [queryString]);

  function toggleMuscle(muscle: MuscleId) {
    setSelectedMuscles((current) => toggleValue(current, muscle));
  }

  function resetFilters() {
    setEquipment([]); setDifficulty([]); setCategories([]); setLocation(''); setTrainingType('');
  }

  async function toggleSaved(exercise: Exercise) {
    const saved = savedIds.includes(exercise.id);
    setSavingId(exercise.id);
    setSavedIds((current) => saved ? current.filter((id) => id !== exercise.id) : [...current, exercise.id]);
    try {
      const response = await fetch('/api/v1/saved-exercises', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exerciseId: exercise.id }),
      });
      if (!response.ok) throw new Error();
      showToast(saved ? `${exercise.name} removed from saved` : `${exercise.name} saved`);
    } catch {
      setSavedIds((current) => saved ? [...current, exercise.id] : current.filter((id) => id !== exercise.id));
      showToast('Could not update saved exercises');
    } finally {
      setSavingId(null);
    }
  }

  const filterProps = {
    equipment, difficulty, categories, location, trainingType,
    onEquipment: (value: string) => setEquipment((current) => toggleValue(current, value)),
    onDifficulty: (value: ExerciseDifficulty) => setDifficulty((current) => toggleValue(current, value)),
    onCategory: (value: ExerciseCategory) => setCategories((current) => toggleValue(current, value)),
    onLocation: setLocation, onTrainingType: setTrainingType, onReset: resetFilters,
  };

  return (
    <div className="page-stack exercises-page">
      <header className="page-header exercises-header">
        <div><span className="eyebrow">Movement library</span><h1>Train with precision.</h1><p>Select a muscle, find the right movement, and add it to your plan without breaking your flow.</p></div>
        <a className="ai-context-card" href="/chat?prompt=Build%20me%20a%2030-minute%20workout%20using%20my%20profile%20and%20available%20equipment">
          <span className="ai-context-icon"><Sparkles /></span><span><strong>Ask Fitcore AI</strong><small>Build a 30-minute session</small></span>
        </a>
      </header>

      <section className="body-explorer" aria-labelledby="body-explorer-title">
        <div className="body-map-panel">
          <div className="panel-heading"><div><span className="eyebrow">Interactive body map</span><h2 id="body-explorer-title">Choose your focus</h2></div><span className="selection-count">{selectedMuscles.length || 'No'} selected</span></div>
          <div className="map-controls">
            <div className="segmented-control" aria-label="Body type"><button type="button" className={gender === 'male' ? 'active' : ''} onClick={() => setGender('male')}>Male</button><button type="button" className={gender === 'female' ? 'active' : ''} onClick={() => setGender('female')}>Female</button></div>
            <div className="segmented-control" aria-label="Body view"><button type="button" className={view === 'front' ? 'active' : ''} onClick={() => setView('front')}>Front</button><button type="button" className={view === 'back' ? 'active' : ''} onClick={() => setView('back')}>Back</button></div>
          </div>
          <BodyMap view={view} gender={gender} selected={selectedMuscles} onToggle={toggleMuscle} />
        </div>

        <div className="muscle-list-panel">
          <div className="panel-heading"><div><span className="eyebrow">Accessible selector</span><h2>Muscle groups</h2></div>{selectedMuscles.length > 0 && <button type="button" className="text-button" onClick={() => setSelectedMuscles([])}>Clear all</button>}</div>
          <p className="panel-copy">Select one or combine several areas. Results update as you build your training focus.</p>
          <div className="muscle-chip-grid">
            {MUSCLES.map((muscle) => (
              <button type="button" key={muscle.id} className={selectedMuscles.includes(muscle.id) ? 'active' : ''} onClick={() => toggleMuscle(muscle.id)} aria-pressed={selectedMuscles.includes(muscle.id)}>
                <span>{selectedMuscles.includes(muscle.id) && <Check />}</span><strong>{muscle.label}</strong><small>{muscle.scientificName}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="exercise-catalog" aria-labelledby="exercise-results-title">
        <div className="catalog-heading">
          <div><span className="eyebrow">Exercise catalog</span><h2 id="exercise-results-title">{selectedMuscles.length ? selectedMuscles.map((id) => MUSCLE_BY_ID[id].label).join(' + ') : 'All exercises'}</h2><p>{loading ? 'Finding the best matches…' : `${total} movement${total === 1 ? '' : 's'} matched`}</p></div>
          <div className="catalog-tools">
            <label className="search-field"><Search /><span className="sr-only">Search exercises</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exercises" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X /></button>}</label>
            <button type="button" className="filter-trigger" onClick={() => setFiltersOpen(true)}><Filter />Filters{activeFilterCount > 0 && <span>{activeFilterCount}</span>}<ChevronDown /></button>
          </div>
        </div>

        {selectedMuscles.length > 0 && <div className="sticky-selection-row"><span>Targeting</span>{selectedMuscles.map((id) => <button type="button" key={id} onClick={() => toggleMuscle(id)}>{MUSCLE_BY_ID[id].label}<X /></button>)}</div>}

        <div className="catalog-layout">
          <aside className="desktop-filter-panel"><FilterPanel {...filterProps} /></aside>
          <div className="catalog-results">
            {loading ? (
              <div className="exercise-skeleton-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-block skeleton-card" key={index} />)}</div>
            ) : error ? (
              <div className="state-panel error-state"><strong>Exercises could not load</strong><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>
            ) : exercises.length === 0 ? (
              <div className="state-panel empty-state"><strong>No exact matches</strong><p>Clear a filter or select a nearby muscle group to widen the results.</p><button type="button" onClick={() => { resetFilters(); setSelectedMuscles([]); setSearch(''); }}>Reset everything</button></div>
            ) : (
              <div className="exercise-grid">{exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} saved={savedIds.includes(exercise.id)} saving={savingId === exercise.id} onSave={() => toggleSaved(exercise)} onAdd={() => setAddExercise(exercise)} />)}</div>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && <div className="mobile-filter-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setFiltersOpen(false)}><section className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label="Exercise filters"><div className="sheet-handle" /><div className="mobile-filter-head"><div><span className="eyebrow">Filters</span><h2>Refine exercises</h2></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button></div><FilterPanel {...filterProps} /><div className="mobile-filter-actions"><button type="button" className="button-secondary" onClick={resetFilters}>Reset</button><button type="button" className="button-primary" onClick={() => setFiltersOpen(false)}>Show {total} results</button></div></section></div>}
      {addExercise && <AddToWorkoutSheet exercise={addExercise} onClose={() => setAddExercise(null)} onSuccess={showToast} />}
      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
    </div>
  );
}
