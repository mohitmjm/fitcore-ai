'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check } from 'lucide-react';

const GOALS = [
  { value: 'muscle gain', label: 'Build muscle' },
  { value: 'weight loss', label: 'Lose fat' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general fitness', label: 'General fitness' },
];
const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const EQUIPMENT = [
  { value: 'gym', label: 'Full gym' },
  { value: 'home_gym', label: 'Home gym' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'bands', label: 'Resistance bands' },
  { value: 'bodyweight', label: 'Bodyweight only' },
];
const DIETS = [
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non_veg', label: 'Non-veg' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'high_protein', label: 'High protein' },
];

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [goal, setGoal] = useState('muscle gain');
  const [experience, setExperience] = useState('beginner');
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);
  const [dietType, setDietType] = useState('non_veg');
  const [injuries, setInjuries] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Skip onboarding if the user already has a profile.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/v1/me');
        if (res.status === 401) {
          router.replace('/');
          return;
        }
        const json = (await res.json()) as { data?: { onboarded?: boolean } };
        if (active && json.data?.onboarded) {
          router.replace('/today');
          return;
        }
      } catch {
        /* show the form anyway */
      }
      if (active) setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  function toggleEquipment(value: string) {
    setEquipment((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          goal,
          experience,
          equipment,
          dietType,
          injuries: injuries.trim() ? [injuries.trim()] : undefined,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: { message: string } };
        setError(json.error?.message ?? 'Could not save. Please try again.');
        setSubmitting(false);
        return;
      }
      router.replace('/today');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Setting things up…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
        <div className="space-y-1.5 text-center">
          <div className="flex justify-center text-cyan-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-white">Let&apos;s build your plan</h1>
          <p className="text-xs text-gray-400">
            Five quick taps. Your coach learns the rest as you go.
          </p>
        </div>

        <Field label="Your main goal">
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <Chip key={g.value} active={goal === g.value} onClick={() => setGoal(g.value)}>
                {g.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Experience">
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE.map((e) => (
              <Chip key={e.value} active={experience === e.value} onClick={() => setExperience(e.value)}>
                {e.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Equipment (pick any)">
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT.map((eq) => (
              <Chip key={eq.value} active={equipment.includes(eq.value)} onClick={() => toggleEquipment(eq.value)}>
                {eq.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Diet preference">
          <div className="grid grid-cols-3 gap-2">
            {DIETS.map((d) => (
              <Chip key={d.value} active={dietType === d.value} onClick={() => setDietType(d.value)}>
                {d.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Any injuries? (optional)">
          <input
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder="e.g. left knee, lower back"
            className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          />
        </Field>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting || equipment.length === 0}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-black text-sm rounded-xl disabled:opacity-60"
        >
          {submitting ? 'Generating your plan…' : 'Generate my plan'}
        </button>
      </div>
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
        active
          ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300'
          : 'bg-[#0b0e14] border-white/10 text-gray-400 hover:border-white/30'
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}
