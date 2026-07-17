'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowRight, Award, Bot, Check, ChevronRight, CircleDot, Clock3, Dumbbell,
  Footprints, Gauge, HeartPulse, Leaf, LockKeyhole, Map, Shield, Sparkles, Target, Trophy, Utensils, Zap,
} from 'lucide-react';
import FitnessAvatar from '@/components/world/FitnessAvatar';
import type { FitnessWorldState, MissionKind, WorldMission, WorldZoneId } from '@/lib/policy/world';

const ZONE_ICONS = { foundation: Map, strength: Dumbbell, endurance: Footprints, mobility: Leaf, nutrition: Utensils, recovery: HeartPulse, elite: Trophy } satisfies Record<WorldZoneId, typeof Map>;
const MISSION_ICONS = { training: Dumbbell, movement: Footprints, nutrition: Utensils, recovery: HeartPulse, consistency: Target } satisfies Record<MissionKind, typeof Target>;

function MissionRow({ mission }: { mission: WorldMission }) {
  const Icon = MISSION_ICONS[mission.kind];
  const progress = Math.min(100, Math.round((mission.progress / Math.max(1, mission.target)) * 100));
  return (
    <Link href={mission.actionHref} className={`world-mission ${mission.completed ? 'is-complete' : ''}`}>
      <span className="mission-icon">{mission.completed ? <Check /> : <Icon />}</span>
      <span className="mission-copy"><strong>{mission.title}</strong><small>{mission.description}</small><i><b style={{ width: `${progress}%` }} /></i></span>
      <span className="mission-value"><strong>{mission.progress.toLocaleString()}/{mission.target.toLocaleString()}</strong><small>{mission.unit} · +{mission.xpReward} XP</small></span>
      <ChevronRight />
    </Link>
  );
}

export default function FitnessWorldPage() {
  const [world, setWorld] = useState<FitnessWorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missionView, setMissionView] = useState<'daily' | 'weekly'>('daily');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/v1/world');
      const json = (await response.json()) as { data?: FitnessWorldState; error?: { message?: string } };
      if (!response.ok || !json.data) throw new Error(json.error?.message ?? 'Your Fitness World could not load.');
      setWorld(json.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your Fitness World could not load.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const missions = useMemo(() => world ? missionView === 'daily' ? world.dailyMissions : world.weeklyQuests : [], [missionView, world]);

  if (loading) return <div className="world-loading"><div className="skeleton-block" /><div className="skeleton-block" /><div className="skeleton-block" /></div>;
  if (error || !world) return <div className="state-panel error-state"><strong>Fitness World is resting</strong><p>{error}</p><button type="button" onClick={() => void load()}>Try again</button></div>;

  const game = world.game;
  const missionsComplete = missions.filter((mission) => mission.completed).length;

  return (
    <div className="page-stack world-page">
      <header className="world-header">
        <div><span className="eyebrow">Fitcore Fitness World</span><h1>Your effort has a world.</h1><p>Every real workout, recovery choice, and healthy habit evolves your performance identity.</p></div>
        <div className="world-header-actions"><Link href="/workout" className="button-primary"><Dumbbell />Train now</Link><Link href="/achievements" className="button-secondary"><Award />Achievements</Link></div>
      </header>

      <section className="world-hero" aria-labelledby="world-level-title">
        <div className="world-hero-grid" aria-hidden="true" />
        <div className="world-level-copy">
          <span className="world-status"><i />World online</span>
          <div className="level-lockup"><span>{game.level}</span><div><small>Current identity</small><h2 id="world-level-title">{game.levelTitle}</h2></div></div>
          <p>{world.journey.unlockedCount} of {world.journey.totalZones} zones unlocked · currently exploring {world.journey.current}</p>
          <div className="world-xp"><span><strong>{game.xp.toLocaleString()} XP</strong><small>{game.xpIntoLevel} / {game.xpForNextLevel} to level {game.level + 1}</small></span><div><i style={{ width: `${game.progressPct}%` }} /></div></div>
          <div className="world-quick-stats"><span><FlameIcon /><strong>{game.consistency.currentStreak}</strong><small>day rhythm</small></span><span><Shield /><strong>{world.metrics.find((item) => item.id === 'recovery')?.score}</strong><small>recovery</small></span><span><Zap /><strong>{missionsComplete}/{missions.length}</strong><small>{missionView} wins</small></span></div>
        </div>
        <FitnessAvatar avatar={world.avatar} level={game.level} />
        <div className="coach-transmission"><span><Bot /></span><div><small>AI coach transmission</small><p>{world.coachMessage}</p></div><Link href="/chat" aria-label="Open AI coach"><ArrowRight /></Link></div>
      </section>

      <section className="fitness-world-map" aria-labelledby="journey-map-title">
        <div className="world-section-heading"><div><span className="eyebrow">Personal journey map</span><h2 id="journey-map-title">Performance territories</h2><p>Your world expands through balanced progress—not extreme effort.</p></div><span className="map-next"><small>Next destination</small><strong>{world.journey.next}</strong></span></div>
        <div className="zone-map">
          <svg className="zone-path" viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true"><path d="M68 320 C190 250 198 118 340 137 S520 322 645 250 S790 70 940 116" /><path className="zone-path-progress" d="M68 320 C190 250 198 118 340 137 S520 322 645 250 S790 70 940 116" /></svg>
          {world.zones.map((zone, index) => { const Icon = ZONE_ICONS[zone.id]; return (
            <article key={zone.id} className={`zone-node zone-${zone.id} ${zone.unlocked ? 'is-unlocked' : 'is-locked'}`} style={{ '--zone-index': index } as React.CSSProperties}>
              <div className="zone-orb"><Icon />{zone.unlocked ? <span>{String(index + 1).padStart(2, '0')}</span> : <LockKeyhole />}</div>
              <div className="zone-copy"><small>{zone.unlocked ? 'Unlocked' : `${zone.progress}% ready`}</small><strong>{zone.name}</strong><p>{zone.description}</p>{!zone.unlocked && <span>{zone.requirement}</span>}</div>
            </article>
          ); })}
        </div>
      </section>

      <div className="world-dashboard-grid">
        <section className="world-metrics" aria-labelledby="performance-scores-title">
          <div className="world-section-heading compact"><div><span className="eyebrow">Live attributes</span><h2 id="performance-scores-title">Performance scores</h2></div><Gauge /></div>
          <div className="metric-radar-list">{world.metrics.map((item) => <div key={item.id}><span><strong>{item.label}</strong><small>{item.trend}</small></span><div><i style={{ width: `${item.score}%` }} /></div><b>{item.score}</b></div>)}</div>
        </section>

        <section className="world-missions" aria-labelledby="missions-title">
          <div className="mission-heading"><div><span className="eyebrow">Clear direction</span><h2 id="missions-title">Missions</h2></div><div className="mission-tabs"><button type="button" className={missionView === 'daily' ? 'active' : ''} onClick={() => setMissionView('daily')}>Daily</button><button type="button" className={missionView === 'weekly' ? 'active' : ''} onClick={() => setMissionView('weekly')}>Weekly</button></div></div>
          <p className="mission-summary"><CircleDot />{missionsComplete} complete · {missions.length - missionsComplete} available · missions adjust to readiness</p>
          <div className="mission-list">{missions.map((mission) => <MissionRow key={mission.id} mission={mission} />)}</div>
        </section>
      </div>

      <div className="world-feature-grid">
        <section className={`boss-battle ${world.boss.completed ? 'is-defeated' : ''}`}>
          <div className="boss-visual"><div className="boss-core"><Shield /><span>{world.boss.health}%</span></div><i /><i /><i /></div>
          <div className="boss-content"><span className="eyebrow">Weekly boss battle</span><h2>{world.boss.name}</h2><p>{world.boss.title}</p><div className="boss-health"><span><strong>{world.boss.completed ? 'Defeated' : 'Boss health'}</strong><small>{world.boss.damage}/{world.boss.target} active days</small></span><div><i style={{ width: `${world.boss.health}%` }} /></div></div><ul>{world.boss.checklist.map((item, index) => <li key={item}>{index < world.boss.damage ? <Check /> : <Clock3 />}{item}</li>)}</ul><div className="boss-reward"><Trophy /><span><small>Victory reward</small><strong>+{world.boss.rewardXp} XP · rare badge progress</strong></span></div></div>
        </section>

        <section className="future-self">
          <div className="future-orbit"><Sparkles /><i /><i /><i /></div><span className="eyebrow">My Fitcore Future</span><h2>A realistic 12-week horizon</h2><p>{world.projection.milestone}</p><div className="projection-list"><div><span>Strength potential</span><strong>{world.projection.strengthRange[0]}–{world.projection.strengthRange[1]}</strong></div><div><span>Endurance potential</span><strong>{world.projection.enduranceRange[0]}–{world.projection.enduranceRange[1]}</strong></div><div><span>Consistency range</span><strong>{world.projection.consistencyRange[0]}–{world.projection.consistencyRange[1]}%</strong></div></div><small className="projection-disclaimer">{world.projection.disclaimer}</small><Link href="/progress">Open progress timeline <ArrowRight /></Link>
        </section>
      </div>
    </div>
  );
}

function FlameIcon() { return <Activity />; }
