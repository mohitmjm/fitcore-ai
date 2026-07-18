import Link from 'next/link';
import { Archive, ChevronLeft, ChevronRight, Download, List, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import styles from './story.module.css';

interface StoryControlsProps {
  paused: boolean;
  muted: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onReplay: () => void;
  onOverview: () => void;
  onArchive: () => void;
  onExport: () => void;
}

export function StoryControls(props: StoryControlsProps) {
  return (
    <>
      <div className={styles.topControls}>
        <Link href="/today" aria-label="Close weekly story"><X /></Link>
        <button type="button" onClick={props.onOverview} aria-label="Open story overview"><List /></button>
        <button type="button" onClick={props.onArchive} aria-label="Open past weekly stories"><Archive /></button>
        <button type="button" onClick={props.onToggleMute} aria-label={props.muted ? 'Enable future story audio' : 'Mute story audio'}>{props.muted ? <VolumeX /> : <Volume2 />}</button>
        <button type="button" onClick={props.onTogglePause} aria-label={props.paused ? 'Resume story' : 'Pause story'}>{props.paused ? <Play /> : <Pause />}</button>
      </div>
      <div className={styles.bottomControls}>
        <button type="button" onClick={props.onPrevious} disabled={!props.canPrevious} aria-label="Previous story card"><ChevronLeft /></button>
        <button type="button" onClick={props.onReplay} aria-label="Replay story"><RotateCcw /><span>Replay</span></button>
        <button type="button" onClick={props.onExport} aria-label="Export or share this story"><Download /><span>Share</span></button>
        <button type="button" onClick={props.onNext} disabled={!props.canNext} aria-label="Next story card"><ChevronRight /></button>
      </div>
    </>
  );
}
