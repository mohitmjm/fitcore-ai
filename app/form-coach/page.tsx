'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Camera, Check, Circle, Eye, Lock, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Square, Video } from 'lucide-react';
import { FORM_EXERCISE_GUIDES, type SupportedFormExercise } from '@/lib/form-coach/types';

export default function FormCoachPage() {
  return <Suspense fallback={<div className="form-coach-loading skeleton-block" />}><FormCoachScreen /></Suspense>;
}

function FormCoachScreen() {
  const searchParams = useSearchParams();
  const requested = searchParams.get('exercise') as SupportedFormExercise | null;
  const initial = FORM_EXERCISE_GUIDES.some((guide) => guide.id === requested) ? requested! : 'squat';
  const [exercise, setExercise] = useState<SupportedFormExercise>(initial);
  const [cameraState, setCameraState] = useState<'off' | 'requesting' | 'ready' | 'denied'>('off');
  const [coaching, setCoaching] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [reps, setReps] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const guide = useMemo(() => FORM_EXERCISE_GUIDES.find((item) => item.id === exercise)!, [exercise]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!coaching) return;
    const timer = window.setInterval(() => setReps((value) => value + 1), guide.tempoSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [coaching, guide.tempoSeconds]);

  async function startCamera() {
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraState('ready');
    } catch { setCameraState('denied'); }
  }

  function stopCamera() {
    setCoaching(false); setRecording(false); setCameraState('off');
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : undefined });
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onstop = () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType })));
    };
    recorder.start(); recorderRef.current = recorder; setRecording(true);
  }

  return (
    <div className="page-stack form-coach-page">
      <header className="form-coach-header"><div><Link href="/exercises" className="back-link"><ArrowLeft />Exercise library</Link><span className="eyebrow">Local-first movement guidance</span><h1>AI Form Coach</h1><p>Set up your camera, align with the target posture, and follow a controlled rep rhythm. Pose scoring is an assistive cue—not a medical assessment.</p></div><div className="privacy-chip"><ShieldCheck /><span><strong>Private by design</strong><small>Camera stays on this device</small></span></div></header>

      <div className="form-coach-grid">
        <section className={`camera-stage camera-${cameraState}`}>
          <video ref={videoRef} muted playsInline aria-label="Live local camera preview" />
          {cameraState !== 'ready' && <div className="camera-empty"><span><Camera /></span><h2>{cameraState === 'denied' ? 'Camera access was not available' : 'Your camera is off'}</h2><p>{cameraState === 'denied' ? 'Check browser permissions or continue with the setup guide without camera mode.' : 'Fitcore requests camera access only after you choose to start. Video is not uploaded.'}</p><button type="button" className="button-primary" onClick={() => void startCamera()} disabled={cameraState === 'requesting'}><Video />{cameraState === 'requesting' ? 'Requesting access…' : cameraState === 'denied' ? 'Try camera again' : 'Start camera mode'}</button></div>}
          {cameraState === 'ready' && <>
            <svg className={`pose-guide ${coaching ? 'is-coaching' : ''}`} viewBox="0 0 400 600" aria-hidden="true">
              <circle cx="200" cy="76" r="36" /><path d="M200 112 L200 260 M200 145 L120 225 M200 145 L280 225 M200 260 L145 405 L132 548 M200 260 L255 405 L268 548" />
              {[['200','112'],['200','145'],['120','225'],['280','225'],['200','260'],['145','405'],['255','405'],['132','548'],['268','548']].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" />)}
            </svg>
            <div className="camera-hud"><span><i />{coaching ? 'Guided timing active' : 'Camera ready'}</span><strong>{guide.camera} view</strong></div>
            <div className="rep-hud"><strong>{String(reps).padStart(2, '0')}</strong><span>tempo reps</span></div>
            {recording && <div className="recording-hud"><i />Recording locally</div>}
          </>}
          {cameraState === 'ready' && <div className="camera-controls"><button type="button" onClick={() => setCoaching((value) => !value)}>{coaching ? <Pause /> : <Play />}{coaching ? 'Pause timing' : 'Start guidance'}</button><button type="button" className={recording ? 'recording' : ''} onClick={toggleRecording}>{recording ? <Square /> : <Circle />}{recording ? 'Stop recording' : 'Record short set'}</button><button type="button" onClick={stopCamera}><Camera />Camera off</button></div>}
        </section>

        <aside className="form-coach-panel">
          <label className="coach-exercise-select"><span>Exercise</span><select value={exercise} onChange={(event) => { setExercise(event.target.value as SupportedFormExercise); setReps(0); setCoaching(false); }}>{FORM_EXERCISE_GUIDES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <div className="coach-setup"><span><Eye /></span><div><small>Camera setup · {guide.camera}</small><p>{guide.setup}</p></div></div>
          <div className="target-posture"><div><span className="eyebrow">Target posture</span><h2>{guide.label}</h2></div><Sparkles /><p>{guide.target}</p><div className="tempo-track"><span>Start</span><i /><span>Move</span><i /><span>Return</span><b>{guide.tempoSeconds}s</b></div></div>
          <section className="pose-data-card"><div><span><Lock />Pose engine interface</span><small>Model not loaded</small></div><p>The landmark and joint-angle data structures are ready for MediaPipe or MoveNet. This build does not claim live biomechanical accuracy.</p><div className="joint-list">{guide.joints.map((joint) => <span key={joint}><i />{joint.replaceAll('_', ' ')}<b>waiting</b></span>)}</div><div className="confidence-row"><span>Analysis confidence</span><strong>0%</strong></div></section>
          {recordedUrl && <div className="local-recording"><Check /><span><strong>Short set captured locally</strong><small>Preview or discard it. Nothing was uploaded.</small></span><video src={recordedUrl} controls /><button type="button" onClick={() => { URL.revokeObjectURL(recordedUrl); setRecordedUrl(''); }}><RotateCcw />Discard</button></div>}
          <aside className="form-safety"><AlertTriangle /><p>Stop if you feel sharp pain, dizziness, chest pain, or unusual shortness of breath. Seek qualified medical help when appropriate.</p></aside>
        </aside>
      </div>
    </div>
  );
}
