'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, LoaderCircle, Play, Video } from 'lucide-react';
import { getExerciseMedia } from '@/lib/exercises/media';
import type { Exercise } from '@/lib/exercises/types';

export default function ExerciseVideoPlayer({ exercise, compact = false }: { exercise: Exercise; compact?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerId = useId();
  const [starting, setStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState(false);
  const media = getExerciseMedia(exercise);

  useEffect(() => {
    const pauseForOtherPlayer = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== playerId) videoRef.current?.pause();
    };
    document.addEventListener('fitcore:exercise-video-play', pauseForOtherPlayer);
    return () => document.removeEventListener('fitcore:exercise-video-play', pauseForOtherPlayer);
  }, [playerId]);

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    setStarting(true);
    setError(false);
    try {
      await video.play();
      setHasStarted(true);
    } catch {
      setError(true);
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className={`exercise-video-player ${compact ? 'is-compact' : ''}`} aria-label={`${exercise.name} video player`}>
      <video
        ref={videoRef}
        className="exercise-video"
        controls={hasStarted}
        playsInline
        preload="metadata"
        aria-label={media.label}
        onError={() => setError(true)}
        onPlay={() => {
          setHasStarted(true);
          document.dispatchEvent(new CustomEvent('fitcore:exercise-video-play', { detail: playerId }));
        }}
      >
        <source src={media.videoUrl} type="video/mp4" />
      </video>
      {!hasStarted && !error && (
        <div className="video-poster" aria-hidden="true">
          <Video />
          <span>Fitcore movement video</span>
        </div>
      )}
      {!hasStarted && (
        <button type="button" className="video-play-button" onClick={play} disabled={starting}>
          {starting ? <LoaderCircle className="is-spinning" /> : <Play fill="currentColor" />}
          <span>{starting ? 'Loading video' : 'Play video'}</span>
        </button>
      )}
      <div className="video-source-note" role={error ? 'alert' : undefined}>
        {error ? <AlertCircle /> : <span className="video-note-dot" />}
        <span>{error ? 'Video could not load. Check your connection and try again.' : 'Development video placeholder — licensed Fitcore exercise footage can be connected here.'}</span>
      </div>
    </section>
  );
}
