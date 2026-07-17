'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react';

const GOALS = [['muscle gain','Build muscle'],['weight loss','Lose fat'],['endurance','Endurance'],['general fitness','General fitness']] as const;
const EXPERIENCE = [['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']] as const;
const ACTIVITY = [['low','Mostly seated'],['moderate','Moderately active'],['high','Highly active']] as const;
const EQUIPMENT = [['gym','Full gym'],['home_gym','Home gym'],['dumbbells','Dumbbells'],['bands','Resistance bands'],['bodyweight','Bodyweight only']] as const;
const DIETS = [['veg','Vegetarian'],['non_veg','Non-veg'],['vegan','Vegan'],['high_protein','High protein']] as const;

function splitNotes(value: string): string[] | undefined { const values = value.split(',').map((item) => item.trim()).filter(Boolean); return values.length ? values : undefined; }

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('muscle gain');
  const [experience, setExperience] = useState('beginner');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [gender, setGender] = useState<'male'|'female'|'other'>('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);
  const [dietType, setDietType] = useState('non_veg');
  const [injuries, setInjuries] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [language, setLanguage] = useState<'english'|'hindi'|'hinglish'>('english');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/v1/me').then(async (response) => {
      if (response.status === 401) { router.replace('/'); return; }
      const json = (await response.json()) as { data?: { onboarded?: boolean } };
      if (active && json.data?.onboarded) router.replace('/today');
      else if (active) setChecking(false);
    }).catch(() => active && setChecking(false));
    return () => { active = false; };
  }, [router]);

  function toggleEquipment(value: string) { setEquipment((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current,value]); }
  function canContinue(): boolean { if (step === 2) return Boolean(age && heightCm && weightKg); if (step === 3) return equipment.length > 0; return true; }

  async function submit() {
    setSubmitting(true); setError('');
    try {
      const response = await fetch('/api/v1/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goal, experience, activityLevel, daysPerWeek, gender, age: Number(age), heightCm: Number(heightCm), weightKg: Number(weightKg), equipment, dietType, injuries: splitNotes(injuries), conditions: splitNotes(conditions), allergies: splitNotes(allergies), language }) });
      const json = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(json.error?.message ?? 'Could not save your profile.');
      router.replace('/today');
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); setSubmitting(false); }
  }

  if (checking) return <div className="welcome-loading"><span /><p>Preparing Fitcore…</p></div>;

  return <main className="welcome-page">
    <div className="welcome-brand"><Image src="/logo.png" alt="Fitcore AI" width={38} height={38} priority /><span><strong>FITCORE</strong><small>PERSONAL SETUP</small></span></div>
    <section className="onboarding-shell">
      <aside className="onboarding-aside"><span className="eyebrow">60-second setup</span><h1>Training built around <em>you.</em></h1><p>These details help Fitcore choose useful workouts and avoid recommendations that do not fit your body or equipment.</p><div className="onboarding-steps">{[['Goal & routine','Your reason for training'],['Body profile','Better recommendations'],['Equipment & safety','Train with confidence']].map(([title,copy],index) => <button type="button" key={title} className={step === index + 1 ? 'active' : step > index + 1 ? 'done' : ''} onClick={() => step > index + 1 && setStep(index + 1)}><span>{step > index + 1 ? <Check /> : index + 1}</span><div><strong>{title}</strong><small>{copy}</small></div></button>)}</div><div className="privacy-note"><ShieldCheck /><span><strong>Your data stays private</strong><small>Used only to personalize Fitcore.</small></span></div></aside>
      <div className="onboarding-form">
        <div className="onboarding-form-scroll">
        <div className="onboarding-progress"><span>Step {step} of 3</span><div><i style={{ width: `${(step/3)*100}%` }} /></div></div>
        {step === 1 && <div className="onboarding-step"><header><Sparkles /><div><h2>What are you working toward?</h2><p>We’ll tune your plan volume and exercise choices around this.</p></div></header><Field label="Main goal"><div className="choice-grid two">{GOALS.map(([value,label]) => <Choice key={value} active={goal===value} onClick={() => setGoal(value)}>{label}</Choice>)}</div></Field><Field label="Experience"><div className="choice-grid three">{EXPERIENCE.map(([value,label]) => <Choice key={value} active={experience===value} onClick={() => setExperience(value)}>{label}</Choice>)}</div></Field><Field label="Daily activity"><div className="choice-grid three">{ACTIVITY.map(([value,label]) => <Choice key={value} active={activityLevel===value} onClick={() => setActivityLevel(value)}>{label}</Choice>)}</div></Field><Field label="Training days per week"><div className="day-selector">{[2,3,4,5,6].map((day) => <button type="button" key={day} className={daysPerWeek===day?'active':''} onClick={() => setDaysPerWeek(day)}>{day}</button>)}</div></Field></div>}
        {step === 2 && <div className="onboarding-step"><header><HeartPulse /><div><h2>Your body profile</h2><p>Used for sensible starting points—not judgement or comparison.</p></div></header><Field label="Gender"><div className="choice-grid three">{(['male','female','other'] as const).map((value) => <Choice key={value} active={gender===value} onClick={() => setGender(value)}>{value[0].toUpperCase()+value.slice(1)}</Choice>)}</div></Field><div className="metric-grid"><Field label="Age"><input type="number" min="13" max="100" inputMode="numeric" placeholder="21" value={age} onChange={(event) => setAge(event.target.value)} /></Field><Field label="Height (cm)"><input type="number" min="100" max="250" inputMode="decimal" placeholder="175" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} /></Field><Field label="Weight (kg)"><input type="number" min="25" max="350" inputMode="decimal" placeholder="70" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} /></Field></div><p className="form-footnote">You can update these values any time from Profile.</p></div>}
        {step === 3 && <div className="onboarding-step"><header><DumbbellIcon /><div><h2>How and where do you train?</h2><p>Tell us what is available and anything the coach should protect.</p></div></header><Field label="Equipment (pick any)"><div className="choice-grid two">{EQUIPMENT.map(([value,label]) => <Choice key={value} active={equipment.includes(value)} onClick={() => toggleEquipment(value)}>{label}</Choice>)}</div></Field><Field label="Diet preference"><div className="choice-grid two">{DIETS.map(([value,label]) => <Choice key={value} active={dietType===value} onClick={() => setDietType(value)}>{label}</Choice>)}</div></Field><div className="health-grid"><Field label="Injuries (optional)"><input placeholder="e.g. left knee, lower back" value={injuries} onChange={(event) => setInjuries(event.target.value)} /></Field><Field label="Medical conditions (optional)"><input placeholder="Comma-separated" value={conditions} onChange={(event) => setConditions(event.target.value)} /></Field><Field label="Allergies (optional)"><input placeholder="Comma-separated" value={allergies} onChange={(event) => setAllergies(event.target.value)} /></Field></div><Field label="Coach language"><div className="choice-grid three">{(['english','hindi','hinglish'] as const).map((value) => <Choice key={value} active={language===value} onClick={() => setLanguage(value)}>{value[0].toUpperCase()+value.slice(1)}</Choice>)}</div></Field></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <footer className="onboarding-actions"><button type="button" className="button-secondary" disabled={step===1||submitting} onClick={() => setStep((value) => value-1)}><ArrowLeft />Back</button>{step<3 ? <button type="button" className="button-primary" disabled={!canContinue()} onClick={() => setStep((value) => value+1)}>Continue <ArrowRight /></button> : <button type="button" className="button-primary" disabled={!canContinue()||submitting} onClick={submit}>{submitting?'Building your plan…':'Create my Fitcore plan'}<ArrowRight /></button>}</footer>
      </div>
    </section>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="onboarding-field"><label>{label}</label>{children}</div>; }
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" className={active?'active':''} onClick={onClick}><span>{active&&<Check />}</span>{children}</button>; }
function DumbbellIcon() { return <span className="dumbbell-glyph">◆</span>; }
