'use client';

import type { WeeklyStoryCard } from '@/lib/policy/weekly-story';
import type { WeeklyStoryShareConfiguration, WeeklyStorySnapshot } from '@/lib/services/weekly-story/types';

const WIDTH = 1080;
const HEIGHT = 1920;

const ACCENTS = {
  lime: ['#c7f65a', '#59d7a0'],
  violet: ['#8d9cff', '#b8c0ff'],
  mint: ['#59d7a0', '#c7f65a'],
  amber: ['#ffc76b', '#ff9f43'],
  coral: ['#ff8a72', '#ffb45e'],
} as const;

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const lines = wrapLines(context, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawPill(context: CanvasRenderingContext2D, text: string, x: number, y: number, accent: string): number {
  context.font = '700 30px Inter, Arial, sans-serif';
  const width = context.measureText(text).width + 52;
  roundedRect(context, x, y, width, 62, 31);
  context.fillStyle = `${accent}24`;
  context.fill();
  context.strokeStyle = `${accent}70`;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = '#f7f8f2';
  context.fillText(text, x + 26, y + 41);
  return width;
}

interface ExportSafeCopy {
  title: string;
  body: string;
  details: string[];
  showConsistencyHero: boolean;
}

function exportSafeCopy(
  story: WeeklyStorySnapshot,
  card: WeeklyStoryCard,
  configuration: WeeklyStoryShareConfiguration,
): ExportSafeCopy {
  const facts = story.storyFacts.privacySafeFacts;
  const details = [facts.dateRange, `${facts.activeDays} active ${facts.activeDays === 1 ? 'day' : 'days'}`];
  if (configuration.showConsistency) details.unshift(`${facts.consistencyPct}% weekly consistency`);
  if (configuration.showWorkoutCount && facts.workoutCount > 0) details.push(`${facts.workoutCount} training days`);
  if (configuration.showLevel) details.push(`Level ${facts.level}`);
  if (configuration.showBadge && facts.badge) details.push(facts.badge);
  if (configuration.showComeback && facts.comeback) details.push(facts.comeback);

  let title = 'A week of showing up.';
  if ((card.type === 'cover' || card.type === 'share') && configuration.showFirstName) {
    title = `${facts.firstName}'s FitCore week`;
  } else if (card.type === 'consistency') {
    title = configuration.showConsistency
      ? `${facts.consistencyPct}% weekly consistency`
      : `${facts.activeDays} active ${facts.activeDays === 1 ? 'day' : 'days'}`;
  } else if (card.type === 'activity') {
    title = 'The work you recorded';
  } else if (card.type === 'standout') {
    title = configuration.showBadge && facts.badge
      ? facts.badge
      : configuration.showComeback && facts.comeback
        ? 'A comeback worth keeping'
        : 'A real week, honestly told';
  } else if (card.type === 'comeback') {
    title = configuration.showComeback && facts.comeback ? 'You came back' : 'The week kept moving';
  } else if (card.type === 'achievement') {
    title = configuration.showLevel
      ? `Level ${facts.level}`
      : configuration.showBadge && facts.badge
        ? facts.badge
        : 'Identity in motion';
  } else if (card.type === 'next_focus') {
    title = 'One focus for next week';
  } else if (card.type === 'progress_trend') {
    title = 'Progress, without overclaiming';
  }

  return {
    title,
    body: 'A privacy-reviewed summary built only from the details you chose to share.',
    details,
    showConsistencyHero: configuration.showConsistency && (card.type === 'share' || card.type === 'consistency'),
  };
}

export function buildShareSummary(story: WeeklyStorySnapshot, configuration: WeeklyStoryShareConfiguration): string {
  const facts = story.storyFacts.privacySafeFacts;
  const parts = [
    configuration.showFirstName ? `${facts.firstName}'s FitCore week` : 'My FitCore week',
    configuration.showConsistency ? `${facts.consistencyPct}% weekly consistency` : `${facts.activeDays} active days`,
  ];
  if (configuration.showWorkoutCount && facts.workoutCount > 0) parts.push(`${facts.workoutCount} training days`);
  if (configuration.showBadge && facts.badge) parts.push(facts.badge);
  if (configuration.showComeback && facts.comeback) parts.push(facts.comeback);
  if (configuration.showLevel) parts.push(`Level ${facts.level}`);
  if (configuration.showBrandedLine) parts.push('Built with FitCore AI · consistency over perfection');
  return parts.join(' · ');
}

export async function renderStoryCardPng(
  story: WeeklyStorySnapshot,
  card: WeeklyStoryCard,
  configuration: WeeklyStoryShareConfiguration = story.shareConfiguration,
): Promise<Blob> {
  if (!card.shareSafe) throw new Error('Private story cards are not exported');
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const [accent, accentTwo] = ACCENTS[card.accent];

  const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#151a18');
  background.addColorStop(0.55, '#090b0b');
  background.addColorStop(1, '#111616');
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = context.createRadialGradient(870, 220, 0, 870, 220, 720);
  glow.addColorStop(0, `${accent}48`);
  glow.addColorStop(1, `${accent}00`);
  context.fillStyle = glow;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.globalAlpha = 0.13;
  context.strokeStyle = accent;
  context.lineWidth = 2;
  for (let x = -400; x < 1400; x += 105) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 760, HEIGHT);
    context.stroke();
  }
  context.globalAlpha = 1;

  context.fillStyle = '#f7f8f2';
  context.font = '900 38px Inter, Arial, sans-serif';
  context.letterSpacing = '4px';
  context.fillText('FITCORE', 80, 108);
  context.letterSpacing = '0px';
  context.textAlign = 'right';
  context.fillStyle = '#9ba39f';
  context.font = '600 28px Inter, Arial, sans-serif';
  context.fillText(story.storyFacts.week.label, WIDTH - 80, 106);
  context.textAlign = 'left';

  context.fillStyle = accent;
  context.font = '800 29px Inter, Arial, sans-serif';
  context.letterSpacing = '3px';
  context.fillText(card.kicker.toUpperCase(), 80, 310);
  context.letterSpacing = '0px';

  const safeCopy = exportSafeCopy(story, card, configuration);
  const title = safeCopy.title;
  context.fillStyle = '#f7f8f2';
  context.font = '900 92px Inter, Arial, sans-serif';
  let cursorY = drawWrapped(context, title, 80, 430, 920, 100, 4);
  context.fillStyle = '#b8c0bb';
  context.font = '500 38px Inter, Arial, sans-serif';
  cursorY = drawWrapped(context, safeCopy.body, 80, cursorY + 32, 850, 55, 4) + 70;

  if (safeCopy.showConsistencyHero) {
    context.fillStyle = accent;
    context.font = '900 210px Inter, Arial, sans-serif';
    context.fillText(String(story.storyFacts.privacySafeFacts.consistencyPct), 76, cursorY + 180);
    context.font = '900 80px Inter, Arial, sans-serif';
    context.fillText('%', 410, cursorY + 180);
    context.fillStyle = '#f7f8f2';
    context.font = '700 32px Inter, Arial, sans-serif';
    context.fillText('WEEKLY CONSISTENCY', 84, cursorY + 236);
    cursorY += 310;
  }

  const details = safeCopy.details;
  let pillX = 80;
  let pillY = Math.max(cursorY, 1050);
  for (const detail of details) {
    context.font = '700 30px Inter, Arial, sans-serif';
    const needed = context.measureText(detail).width + 52;
    if (pillX + needed > WIDTH - 80) {
      pillX = 80;
      pillY += 82;
    }
    const width = drawPill(context, detail, pillX, pillY, accentTwo);
    pillX += width + 18;
  }

  roundedRect(context, 80, HEIGHT - 330, WIDTH - 160, 2, 1);
  context.fillStyle = `${accent}70`;
  context.fill();
  context.fillStyle = '#f7f8f2';
  context.font = '800 42px Inter, Arial, sans-serif';
  context.fillText(configuration.showBrandedLine ? 'Consistency over perfection.' : 'One real action at a time.', 80, HEIGHT - 230);
  context.fillStyle = '#9ba39f';
  context.font = '500 28px Inter, Arial, sans-serif';
  context.fillText('fitcore.ai', 80, HEIGHT - 165);
  context.textAlign = 'right';
  context.fillText('1080 × 1920', WIDTH - 80, HEIGHT - 165);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image export failed')), 'image/png', 0.95);
  });
}

export function downloadStoryBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
