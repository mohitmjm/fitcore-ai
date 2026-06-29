-- Shared exercise library for the first core fitness slice.

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  target_muscles TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  movement_pattern TEXT NOT NULL,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  coach_tip TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exercises_difficulty_supported
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
);

DROP TRIGGER IF EXISTS trg_exercises_updated_at ON public.exercises;
CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_exercises_active_name ON public.exercises (is_active, name);
CREATE INDEX IF NOT EXISTS idx_exercises_muscles ON public.exercises USING GIN (target_muscles);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises USING GIN (equipment);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercises_read_active" ON public.exercises;
CREATE POLICY "exercises_read_active" ON public.exercises
  FOR SELECT USING (is_active = TRUE);

GRANT SELECT ON public.exercises TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.exercises TO service_role;

INSERT INTO public.exercises (
  slug,
  name,
  target_muscles,
  equipment,
  difficulty,
  movement_pattern,
  instructions,
  coach_tip
)
VALUES
  (
    'bodyweight-squat',
    'Bodyweight Squat',
    ARRAY['quads', 'glutes', 'core'],
    ARRAY['bodyweight'],
    'beginner',
    'squat',
    ARRAY[
      'Stand with feet about shoulder-width apart.',
      'Push hips back and bend knees until thighs are near parallel.',
      'Drive through mid-foot and stand tall without locking the knees.'
    ],
    'Keep the chest proud and knees tracking in line with your toes.'
  ),
  (
    'push-up',
    'Push-up',
    ARRAY['chest', 'triceps', 'shoulders', 'core'],
    ARRAY['bodyweight'],
    'beginner',
    'push',
    ARRAY[
      'Start in a high plank with hands under shoulders.',
      'Lower with elbows about 45 degrees from your body.',
      'Press the floor away until arms are straight.'
    ],
    'Use an incline if your hips sag or your reps get sloppy.'
  ),
  (
    'dumbbell-goblet-squat',
    'Dumbbell Goblet Squat',
    ARRAY['quads', 'glutes', 'upper back'],
    ARRAY['dumbbells', 'home_gym', 'gym'],
    'beginner',
    'squat',
    ARRAY[
      'Hold one dumbbell vertically against your chest.',
      'Sit between your hips while keeping elbows inside the knees.',
      'Stand up by pushing the floor away.'
    ],
    'Pause for one second at the bottom to build control.'
  ),
  (
    'dumbbell-romanian-deadlift',
    'Dumbbell Romanian Deadlift',
    ARRAY['hamstrings', 'glutes', 'lower back'],
    ARRAY['dumbbells', 'home_gym', 'gym'],
    'intermediate',
    'hinge',
    ARRAY[
      'Hold dumbbells in front of thighs with soft knees.',
      'Hinge at the hips and slide dumbbells down the legs.',
      'Stop when hamstrings stretch, then squeeze glutes to stand.'
    ],
    'The hips move back; the knees should not turn it into a squat.'
  ),
  (
    'band-row',
    'Resistance Band Row',
    ARRAY['lats', 'mid back', 'biceps'],
    ARRAY['bands', 'home_gym'],
    'beginner',
    'pull',
    ARRAY[
      'Anchor the band at chest height.',
      'Pull elbows behind ribs while keeping shoulders down.',
      'Return slowly until arms are straight.'
    ],
    'Start each rep by pulling shoulder blades back, not by shrugging.'
  ),
  (
    'dumbbell-bench-press',
    'Dumbbell Bench Press',
    ARRAY['chest', 'triceps', 'shoulders'],
    ARRAY['dumbbells', 'gym', 'home_gym'],
    'intermediate',
    'push',
    ARRAY[
      'Lie on a bench with dumbbells above chest.',
      'Lower until elbows are slightly below the torso.',
      'Press up and bring dumbbells over mid-chest.'
    ],
    'Keep shoulder blades pinned to the bench throughout the set.'
  ),
  (
    'lat-pulldown',
    'Lat Pulldown',
    ARRAY['lats', 'upper back', 'biceps'],
    ARRAY['gym'],
    'beginner',
    'pull',
    ARRAY[
      'Grip the bar just outside shoulder width.',
      'Pull elbows down toward ribs until the bar reaches upper chest.',
      'Control the return without letting shoulders shrug up.'
    ],
    'Think elbows to pockets instead of bar to chest.'
  ),
  (
    'walking-lunge',
    'Walking Lunge',
    ARRAY['quads', 'glutes', 'hamstrings'],
    ARRAY['bodyweight', 'dumbbells', 'gym', 'home_gym'],
    'intermediate',
    'lunge',
    ARRAY[
      'Step forward and lower until both knees bend near 90 degrees.',
      'Drive through the front foot to stand and step into the next rep.',
      'Alternate legs while keeping torso tall.'
    ],
    'Shorten your stride if your front knee collapses inward.'
  ),
  (
    'plank',
    'Forearm Plank',
    ARRAY['core', 'glutes', 'shoulders'],
    ARRAY['bodyweight'],
    'beginner',
    'core',
    ARRAY[
      'Place elbows under shoulders and extend legs.',
      'Squeeze glutes and brace as if preparing for a punch.',
      'Hold a straight line from head to heels.'
    ],
    'Stop the set when your lower back starts to sag.'
  ),
  (
    'barbell-deadlift',
    'Barbell Deadlift',
    ARRAY['hamstrings', 'glutes', 'back', 'core'],
    ARRAY['gym'],
    'advanced',
    'hinge',
    ARRAY[
      'Set mid-foot under the bar and grip just outside legs.',
      'Brace, pull slack from the bar, and push the floor away.',
      'Lock out with hips and knees together, then lower under control.'
    ],
    'If your back rounds before the bar moves, reduce load and rebuild the setup.'
  ),
  (
    'overhead-press',
    'Standing Overhead Press',
    ARRAY['shoulders', 'triceps', 'core'],
    ARRAY['dumbbells', 'gym', 'home_gym'],
    'intermediate',
    'push',
    ARRAY[
      'Start with weights at shoulder height and ribs stacked over hips.',
      'Press overhead without leaning back.',
      'Lower to shoulders with control.'
    ],
    'Brace your abs before every rep to avoid turning it into a backbend.'
  ),
  (
    'hip-thrust',
    'Hip Thrust',
    ARRAY['glutes', 'hamstrings', 'core'],
    ARRAY['gym', 'home_gym', 'dumbbells'],
    'intermediate',
    'hinge',
    ARRAY[
      'Place upper back on a bench with feet planted.',
      'Drive hips up until knees, hips, and shoulders form a line.',
      'Pause at the top, then lower under control.'
    ],
    'Keep ribs down and finish with glutes, not the lower back.'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  target_muscles = EXCLUDED.target_muscles,
  equipment = EXCLUDED.equipment,
  difficulty = EXCLUDED.difficulty,
  movement_pattern = EXCLUDED.movement_pattern,
  instructions = EXCLUDED.instructions,
  coach_tip = EXCLUDED.coach_tip,
  is_active = TRUE;
