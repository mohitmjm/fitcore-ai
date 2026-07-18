import type { OwnedDoc } from '@/lib/db/repository';
import type { MomentumQuestKind } from '@/lib/policy/momentum';

export interface MomentumCompletionDoc extends OwnedDoc {
  date: string;
  questId: string;
  kind: MomentumQuestKind;
  title: string;
  durationMinutes: number;
  xpReward: number;
  completedAt: Date;
}
