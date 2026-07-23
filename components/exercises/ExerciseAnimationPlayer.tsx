'use client';

import { Expand, Pause, Play, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getExerciseMedia } from '@/lib/exercises/media';
import type { Exercise } from '@/lib/exercises/types';

type ExercisePreview = Pick<Exercise, 'name'> & Partial<Pick<Exercise, 'slug'>>;

export default function ExerciseAnimationPlayer({ exercise, compact = false }: { exercise: ExercisePreview; compact?: boolean }) {
  const media = getExerciseMedia(exercise.slug);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<'front' | 'side'>('front');
  const [failed, setFailed] = useState(false);
  const source = view === 'side' && media.sideViewUrl ? media.sideViewUrl : media.fullVideoUrl ?? media.previewUrl;
  const canPlay = media.mediaStatus === 'approved' && Boolean(source) && !failed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { await video.play(); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
  }

  async function replay() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    await video.play();
    setPlaying(true);
  }

  async function fullscreen() {
    const container = videoRef.current?.closest('.exercise-animation-player');
    if (container && 'requestFullscreen' in container) await container.requestFullscreen();
  }

  if (!canPlay) return <div className={`exercise-animation-player is-unavailable ${compact ? 'is-compact' : ''}`} role="group" aria-label={`${exercise.name} exercise media`}><div className="animation-pending"><TriangleAlert /><strong>Professional demo pending</strong>{!compact && <p>This exercise needs a reviewed, licensed movement video before it can be shown here.</p>}</div><span className="animation-status">Media review required</span></div>;

  return <div className={`exercise-animation-player ${compact ? 'is-compact' : ''}`} role="group" aria-label={`${exercise.name} exercise demonstration`}>
    <video ref={videoRef} key={source} className="exercise-animation-video" src={source} poster={media.posterUrl} muted loop playsInline autoPlay={!compact} preload={compact ? 'metadata' : 'auto'} onError={() => setFailed(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    {!compact && <div className="animation-controls"><button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause exercise demonstration' : 'Play exercise demonstration'}>{playing ? <Pause /> : <Play />}</button><button type="button" onClick={replay} aria-label="Replay exercise demonstration"><RotateCcw /></button>{media.sideViewUrl && <div className="animation-view-switch"><button type="button" className={view === 'front' ? 'active' : ''} onClick={() => setView('front')}>Front</button><button type="button" className={view === 'side' ? 'active' : ''} onClick={() => setView('side')}>Side</button></div>}<label><span className="sr-only">Playback speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option></select></label><button type="button" onClick={fullscreen} aria-label="View exercise demonstration full screen"><Expand /></button></div>}
  </div>;
}
