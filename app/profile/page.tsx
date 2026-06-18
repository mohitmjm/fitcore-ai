'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Dumbbell, Apple, Activity, Check, RotateCw, Sparkles } from 'lucide-react';

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

interface ProfileResponse {
  name: string;
  email: string;
  locale: string;
  profile: {
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
  const [loaded, setLoaded] = useState(false);
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
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/profile');
      if (!res.ok) return;
      const json = (await res.json()) as { data?: ProfileResponse };
      const d = json.data;
      if (!d) return;
      setName(d.name ?? '');
      setEmail(d.email ?? '');
      setWeightKg(d.profile.weightKg?.toString() ?? '');
      setHeightCm(d.profile.heightCm?.toString() ?? '');
      if (d.profile.goal) setGoal(d.profile.goal);
      if (d.profile.experience) setExperience(d.profile.experience);
      if (d.profile.equipment?.length) setEquipment(d.profile.equipment);
      if (d.profile.dietType) setDietType(d.profile.dietType);
      if (d.daysPerWeek) setDaysPerWeek(d.daysPerWeek);
      setAllergiesInput((d.profile.allergies ?? []).join(', '));
      setLanguage(d.locale === 'hinglish' ? 'hinglish' : 'english');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleEquipment(v: string) {
    setEquipment((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('Saving…');
    const allergies = allergiesInput.split(',').map((a) => a.trim()).filter(Boolean);
    try {
      await fetch('/api/v1/profile', {
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
      setStatus('Saved. Regenerating your plan…');
      await fetch('/api/v1/plan', { method: 'POST' });
      setStatus('All set! Redirecting to Today…');
      setTimeout(() => router.push('/today'), 1200);
    } catch {
      setStatus('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <div className="text-center py-10 text-gray-400">Loading your profile…</div>;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="h-8 w-8 text-cyan-400" />
          Fitness{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Profile</span>
        </h1>
        <p className="text-gray-400 mt-1.5 text-sm">
          Update your essentials — saving regenerates your plan. The coach learns the rest over time.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Physical */}
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

        {/* Training */}
        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Dumbbell className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Training</h2>
          </div>
          <Field label="Goal">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>{g}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Experience">
            <div className="flex gap-2">
              {EXPERIENCE.map((x) => (
                <Chip key={x} active={experience === x} onClick={() => setExperience(x)}>{x}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Equipment (pick any)">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((eq) => (
                <Chip key={eq.value} active={equipment.includes(eq.value)} onClick={() => toggleEquipment(eq.value)}>
                  {eq.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Days per week">
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full md:w-60 bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} days / week</option>
              ))}
            </select>
          </Field>
        </section>

        {/* Nutrition + prefs */}
        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Apple className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Nutrition &amp; Preferences</h2>
          </div>
          <Field label="Diet preference">
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => (
                <Chip key={d.value} active={dietType === d.value} onClick={() => setDietType(d.value)}>{d.label}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Allergies / exclusions">
            <input
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              placeholder="e.g. peanuts, dairy (comma separated)"
              className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            />
          </Field>
          <Field label="Coach language">
            <div className="flex gap-2">
              {(['english', 'hinglish'] as const).map((l) => (
                <Chip key={l} active={language === l} onClick={() => setLanguage(l)}>{l}</Chip>
              ))}
            </div>
          </Field>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm rounded-xl disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save & regenerate plan'}
          </button>
          {status && <span className="text-xs text-gray-400">{status}</span>}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  onChange: (v: string) => void;
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-60"
      />
    </Field>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
