import type { OwnedDoc } from '@/lib/db/repository';

export interface ReadinessInput {
  energy: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  soreness: 1 | 2 | 3 | 4 | 5;
  stress: 1 | 2 | 3 | 4 | 5;
  timeMinutes: 15 | 30 | 45 | 60;
  busy?: boolean;
  traveling?: boolean;
  sick?: boolean;
}

export type ReadinessBand = 'recover' | 'reset' | 'steady' | 'push';

export interface ReadinessSnapshot {
  date: string;
  score: number;
  band: ReadinessBand;
  title: string;
  message: string;
  checkin: ReadinessInput;
}

export interface ReadinessDoc extends OwnedDoc, ReadinessSnapshot {}
