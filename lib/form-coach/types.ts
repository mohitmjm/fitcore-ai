export type SupportedFormExercise = 'squat' | 'push-up' | 'biceps-curl' | 'shoulder-press' | 'lunge' | 'plank';

export interface PoseLandmark {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility: number;
}

export interface JointAngle {
  joint: 'left_knee' | 'right_knee' | 'left_elbow' | 'right_elbow' | 'left_hip' | 'right_hip' | 'spine';
  degrees: number;
  targetRange: [number, number];
  confidence: number;
}

export interface FormFeedback {
  severity: 'cue' | 'warning' | 'stop';
  code: string;
  message: string;
  joint?: JointAngle['joint'];
  timestampMs: number;
}

export interface FormAnalysisSession {
  id: string;
  exercise: SupportedFormExercise;
  startedAt: string;
  processing: 'local';
  model: 'not_loaded' | 'mediapipe' | 'movenet';
  landmarks: PoseLandmark[];
  angles: JointAngle[];
  feedback: FormFeedback[];
  repCount: number;
  confidence: number;
  recordingUrl?: string;
}

export interface FormExerciseGuide {
  id: SupportedFormExercise;
  label: string;
  camera: 'side' | 'front';
  setup: string;
  target: string;
  tempoSeconds: number;
  joints: JointAngle['joint'][];
}

export const FORM_EXERCISE_GUIDES: FormExerciseGuide[] = [
  { id: 'squat', label: 'Squat', camera: 'side', setup: 'Place the phone at hip height, far enough away to see your full body.', target: 'Keep the foot grounded, knees tracking with toes, and spine comfortably braced.', tempoSeconds: 4, joints: ['left_knee', 'left_hip', 'spine'] },
  { id: 'push-up', label: 'Push-up', camera: 'side', setup: 'Place the phone low and side-on so shoulders, hips, and ankles remain visible.', target: 'Move as one line and keep elbows in a comfortable diagonal path.', tempoSeconds: 4, joints: ['left_elbow', 'left_hip', 'spine'] },
  { id: 'biceps-curl', label: 'Biceps curl', camera: 'front', setup: 'Frame the body from hips to head with both elbows visible.', target: 'Keep upper arms quiet and avoid using torso momentum.', tempoSeconds: 3, joints: ['left_elbow', 'right_elbow', 'spine'] },
  { id: 'shoulder-press', label: 'Shoulder press', camera: 'front', setup: 'Frame the torso and both hands with space above your head.', target: 'Keep ribs stacked and press within a pain-free overhead path.', tempoSeconds: 4, joints: ['left_elbow', 'right_elbow', 'spine'] },
  { id: 'lunge', label: 'Lunge', camera: 'side', setup: 'Place the phone at knee-to-hip height and keep both feet in frame.', target: 'Lower with control while the front foot stays planted.', tempoSeconds: 4, joints: ['left_knee', 'right_knee', 'left_hip'] },
  { id: 'plank', label: 'Plank', camera: 'side', setup: 'Place the phone low and side-on so shoulder, hip, and ankle are visible.', target: 'Hold a long neutral line while breathing behind the brace.', tempoSeconds: 5, joints: ['left_elbow', 'left_hip', 'spine'] },
];

export function calculateJointAngle(a: PoseLandmark, vertex: PoseLandmark, c: PoseLandmark): number {
  const first = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const second = Math.atan2(c.y - vertex.y, c.x - vertex.x);
  let angle = Math.abs((first - second) * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle * 10) / 10;
}
