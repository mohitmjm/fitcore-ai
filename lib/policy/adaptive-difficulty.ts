export type EffortFeedback = 'too_easy' | 'appropriate' | 'challenging' | 'too_difficult' | 'pain';

export interface DifficultyAdjustment {
  feedback: EffortFeedback;
  loadChangePct: number;
  setChange: -1 | 0 | 1;
  restChangeSeconds: number;
  allowProgression: boolean;
  requiresSafetyReview: boolean;
  message: string;
}

/** Conservative next-session guidance. Pain always blocks automatic progression. */
export function adaptDifficulty(feedback: EffortFeedback): DifficultyAdjustment {
  switch (feedback) {
    case 'too_easy':
      return { feedback, loadChangePct: 2.5, setChange: 0, restChangeSeconds: 0, allowProgression: true, requiresSafetyReview: false, message: 'Next time, Fitcore can make one small progression while preserving technique.' };
    case 'appropriate':
      return { feedback, loadChangePct: 0, setChange: 0, restChangeSeconds: 0, allowProgression: true, requiresSafetyReview: false, message: 'The dose was right. Repeat it or progress only after the target feels stable.' };
    case 'challenging':
      return { feedback, loadChangePct: 0, setChange: 0, restChangeSeconds: 15, allowProgression: false, requiresSafetyReview: false, message: 'Keep the current load and take a little more rest next time.' };
    case 'too_difficult':
      return { feedback, loadChangePct: -7.5, setChange: 0, restChangeSeconds: 30, allowProgression: false, requiresSafetyReview: false, message: 'Fitcore will reduce the next dose and protect clean repetitions.' };
    case 'pain':
      return { feedback, loadChangePct: 0, setChange: -1, restChangeSeconds: 0, allowProgression: false, requiresSafetyReview: true, message: 'Automatic progression is paused. Stop the painful movement and use a pain-free alternative.' };
  }
}
