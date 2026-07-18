import { Eye, Images, ShieldCheck } from 'lucide-react';
import type { WeeklyStoryShareConfiguration } from '@/lib/services/weekly-story/types';
import styles from './story.module.css';

interface StoryPrivacySettingsProps {
  configuration: WeeklyStoryShareConfiguration;
  includeProgressPhotos: boolean;
  photoBusy: boolean;
  onChange: (configuration: WeeklyStoryShareConfiguration) => void;
  onPhotoChange: (include: boolean) => void;
}

const OPTIONS: { key: keyof WeeklyStoryShareConfiguration; label: string }[] = [
  { key: 'showFirstName', label: 'First name' },
  { key: 'showConsistency', label: 'Consistency percentage' },
  { key: 'showWorkoutCount', label: 'Training count' },
  { key: 'showBadge', label: 'Badge' },
  { key: 'showComeback', label: 'Comeback' },
  { key: 'showLevel', label: 'Level' },
  { key: 'showBrandedLine', label: 'FitCore line' },
];

export function StoryPrivacySettings({ configuration, includeProgressPhotos, photoBusy, onChange, onPhotoChange }: StoryPrivacySettingsProps) {
  return (
    <section className={styles.privacyPanel} aria-labelledby="share-privacy-title">
      <header><ShieldCheck /><div><h3 id="share-privacy-title">Privacy review</h3><p>Only these safe details can appear on the external share card.</p></div></header>
      <div className={styles.toggleGrid}>
        {OPTIONS.map((option) => <label key={option.key}><span><Eye />{option.label}</span><input type="checkbox" checked={configuration[option.key]} onChange={(event) => onChange({ ...configuration, [option.key]: event.target.checked })} /></label>)}
      </div>
      <label className={styles.photoToggle}><span><Images /><b>Private in-app progress photo comparison</b><small>Requires two HTTPS photos at least 14 days apart. Never added to the external share card.</small></span><input type="checkbox" checked={includeProgressPhotos} disabled={photoBusy} onChange={(event) => onPhotoChange(event.target.checked)} /></label>
    </section>
  );
}
