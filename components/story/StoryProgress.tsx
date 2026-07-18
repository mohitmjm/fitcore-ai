import styles from './story.module.css';

interface StoryProgressProps {
  count: number;
  activeIndex: number;
  elapsedPct: number;
  onSelect: (index: number) => void;
}

export function StoryProgress({ count, activeIndex, elapsedPct, onSelect }: StoryProgressProps) {
  return (
    <div className={styles.progress} aria-label={`Story ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <button key={index} type="button" onClick={() => onSelect(index)} aria-label={`Go to story card ${index + 1}`} aria-current={index === activeIndex ? 'step' : undefined}>
          <i style={{ width: index < activeIndex ? '100%' : index === activeIndex ? `${elapsedPct}%` : '0%' }} />
        </button>
      ))}
    </div>
  );
}
