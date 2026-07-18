'use client';

import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  Apple,
  Check,
  Dumbbell,
  RefreshCw,
  RotateCw,
  Sparkles,
  User,
} from 'lucide-react';

const GOALS = ['muscle gain', 'weight loss', 'endurance', 'general fitness'];
const EXPERIENCE = ['beginner', 'intermediate', 'advanced'];
const EQUIPMENT = [
  { value: 'gym', label: 'Full gym' },
  { value: 'home_gym', label: 'Home gym' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'bands', label: 'Bands' },
  { value: 'bodyweight', label: 'Bodyweight' },
];
const DIETS = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-veg' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'high_protein', label: 'High protein' },
];

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type StatusTone = 'idle' | 'saving' | 'success' | 'warning' | 'error';
type Locale = 'english' | 'hindi' | 'hinglish';

interface ProfileResponse {
  name: string;
  email: string;
  locale: string;
  profile?: {
    weightKg?: number;
    heightCm?: number;
    goal?: string;
    experience?: string;
    equipment?: string[];
    dietType?: string;
    allergies?: string[];
  };
  daysPerWeek?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [goal, setGoal] = useState('muscle gain');
  const [experience, setExperience] = useState('beginner');
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);
  const [dietType, setDietType] = useState('non_veg');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [language, setLanguage] = useState<Locale>('english');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: StatusTone; message: string }>({ tone: 'idle', message: '' });

  const load = useCallback(async () => {
    setLoadState('loading');
    setLoadError('');
    try {
      const response = await fetch('/api/v1/profile', { cache: 'no-store' });
      if (!response.ok) throw new Error(await responseMessage(response, 'Could not load your profile.'));

      const json = (await response.json()) as { data?: ProfileResponse };
      const data = json.data;
      if (!data) {
        setLoadState('empty');
        return;
      }

      const profile = data.profile ?? {};
      setName(data.name ?? '');
      setEmail(data.email ?? '');
      setWeightKg(profile.weightKg?.toString() ?? '');
      setHeightCm(profile.heightCm?.toString() ?? '');
      if (profile.goal) setGoal(profile.goal);
      if (profile.experience) setExperience(profile.experience);
      if (profile.equipment?.length) setEquipment(profile.equipment);
      if (profile.dietType) setDietType(profile.dietType);
      if (data.daysPerWeek) setDaysPerWeek(data.daysPerWeek);
      setAllergiesInput((profile.allergies ?? []).join(', '));
      setLanguage(data.locale === 'hindi' || data.locale === 'hinglish' ? data.locale : 'english');
      setLoadState('ready');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load your profile.');
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleEquipment(value: string) {
    setEquipment((previous) => (previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setStatus({ tone: 'saving', message: 'Saving profile...' });
    const allergies = allergiesInput.split(',').map((item) => item.trim()).filter(Boolean);

    try {
      const profileResponse = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          weightKg: weightKg ? Number(weightKg) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          goal,
          experience,
          equipment,
          dietType,
          daysPerWeek: Number(daysPerWeek),
          allergies,
          language,
        }),
      });
      if (!profileResponse.ok) {
        throw new Error(await responseMessage(profileResponse, 'Could not save your profile.'));
      }

      setStatus({ tone: 'saving', message: 'Profile saved. Refreshing your plan...' });
      const planResponse = await fetch('/api/v1/plan', { method: 'POST' });
      if (!planResponse.ok) {
        const message = await responseMessage(planResponse, 'plan regeneration failed.');
        setStatus({ tone: 'warning', message: `Profile saved, but ${message}` });
        return;
      }

      setStatus({ tone: 'success', message: 'Profile saved. Redirecting to Today...' });
      setTimeout(() => router.push('/today'), 900);
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loadState === 'loading') return <ProfileLoadingState />;

  if (loadState === 'error') {
    return (
      <ProfileStatePanel
        icon={<AlertCircle className="h-5 w-5" />}
        title="Profile could not load"
        description={loadError || 'Check your connection and try again.'}
        action={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-400"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        }
      />
    );
  }

  if (loadState === 'empty') {
    return (
      <ProfileStatePanel
        icon={<User className="h-5 w-5" />}
        title="Create your fitness profile"
        description="Finish the quick setup so Fitcore can personalize your workouts, meals, and coaching."
        action={
          <Link
            href="/welcome"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-400"
          >
            Start setup
            <Sparkles className="h-4 w-4" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="h-8 w-8 text-cyan-400" />
          Fitness{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Profile</span>
        </h1>
        <p className="text-gray-400 mt-1.5 text-sm">
          Update your essentials. Saving regenerates your plan and keeps the coach aligned.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Physical &amp; Core</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Display Name" value={name} onChange={setName} required />
            <Input label="Email" value={email} onChange={setEmail} disabled />
            <Input label="Weight (kg)" value={weightKg} onChange={setWeightKg} type="number" />
            <Input label="Height (cm)" value={heightCm} onChange={setHeightCm} type="number" />
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Dumbbell className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Training</h2>
          </div>
          <Field label="Goal">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((item) => (
                <Chip key={item} active={goal === item} onClick={() => setGoal(item)}>{item}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Experience">
            <div className="flex gap-2">
              {EXPERIENCE.map((item) => (
                <Chip key={item} active={experience === item} onClick={() => setExperience(item)}>{item}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Equipment (pick any)">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((item) => (
                <Chip key={item.value} active={equipment.includes(item.value)} onClick={() => toggleEquipment(item.value)}>
                  {item.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Days per week">
            <select
              value={daysPerWeek}
              onChange={(event) => setDaysPerWeek(Number(event.target.value))}
              className="w-full md:w-60 bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            >
              {[2, 3, 4, 5, 6, 7].map((item) => (
                <option key={item} value={item}>{item} days / week</option>
              ))}
            </select>
          </Field>
        </section>

        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Apple className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Nutrition &amp; Preferences</h2>
          </div>
          <Field label="Diet preference">
            <div className="flex flex-wrap gap-2">
              {DIETS.map((item) => (
                <Chip key={item.value} active={dietType === item.value} onClick={() => setDietType(item.value)}>{item.label}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Allergies / exclusions">
            <input
              value={allergiesInput}
              onChange={(event) => setAllergiesInput(event.target.value)}
              placeholder="e.g. peanuts, dairy (comma separated)"
              className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            />
          </Field>
          <Field label="Coach language">
            <div className="flex gap-2">
              {(['english', 'hindi', 'hinglish'] as const).map((item) => (
                <Chip key={item} active={language === item} onClick={() => setLanguage(item)}>{item}</Chip>
              ))}
            </div>
          </Field>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save & regenerate plan'}
          </button>
          {status.message && (
            <span aria-live="polite" className={`max-w-xl text-xs leading-5 ${statusClass(status.tone)}`}>
              {status.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-60"
      />
    </Field>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
        active ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300' : 'bg-[#0b0e14] border-white/10 text-gray-400 hover:border-white/30'
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function ProfileLoadingState() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading fitness profile">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-xl bg-white/10" />
        <div className="h-4 w-full max-w-lg rounded-full bg-white/5" />
      </div>
      {[0, 1, 2].map((item) => (
        <section key={item} className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
          <div className="h-5 w-44 rounded-full bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-11 rounded-xl bg-white/5" />
            <div className="h-11 rounded-xl bg-white/5" />
          </div>
        </section>
      ))}
    </div>
  );
}

function ProfileStatePanel({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <section className="glass-panel mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">{icon}</span>
      <div>
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
      </div>
      {action}
    </section>
  );
}

function statusClass(tone: StatusTone) {
  if (tone === 'success') return 'text-emerald-300';
  if (tone === 'warning') return 'text-amber-300';
  if (tone === 'error') return 'text-red-300';
  return 'text-gray-400';
}

async function responseMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string }; message?: string };
    return body.error?.message ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}
