import type { ReactNode } from 'react';
import type { StoryAccent } from '@/lib/policy/weekly-story';
import styles from './story.module.css';

interface StoryCardFrameProps {
  accent: StoryAccent;
  kicker: string;
  title: string;
  body: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function StoryCardFrame({ accent, kicker, title, body, icon, children, className = '' }: StoryCardFrameProps) {
  return (
    <article className={`${styles.card} ${styles[`accent${accent}`]} ${className}`}>
      <div className={styles.ambient} aria-hidden="true"><i /><i /><i /></div>
      <header className={styles.cardHeader}>
        <span className={styles.kicker}>{icon}{kicker}</span>
        <span className={styles.brandMark}>FC</span>
      </header>
      <div className={styles.cardCopy}><h2>{title}</h2><p>{body}</p></div>
      {children}
      <footer className={styles.cardFooter}><strong>FITCORE</strong><span>Consistency, honestly told.</span></footer>
    </article>
  );
}
