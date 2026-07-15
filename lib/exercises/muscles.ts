import type { MuscleDefinition, MuscleId } from './types';

export const MUSCLES: MuscleDefinition[] = [
  { id: 'neck', label: 'Neck', scientificName: 'Sternocleidomastoid and cervical extensors', view: 'both' },
  { id: 'chest', label: 'Chest', scientificName: 'Pectoralis major', view: 'front' },
  { id: 'upper-chest', label: 'Upper chest', scientificName: 'Clavicular pectoralis', view: 'front' },
  { id: 'lower-chest', label: 'Lower chest', scientificName: 'Sternal pectoralis', view: 'front' },
  { id: 'shoulders', label: 'Shoulders', scientificName: 'Deltoid complex', view: 'both' },
  { id: 'front-deltoids', label: 'Front delts', scientificName: 'Anterior deltoid', view: 'front' },
  { id: 'side-deltoids', label: 'Side delts', scientificName: 'Lateral deltoid', view: 'both' },
  { id: 'rear-deltoids', label: 'Rear delts', scientificName: 'Posterior deltoid', view: 'back' },
  { id: 'biceps', label: 'Biceps', scientificName: 'Biceps brachii', view: 'front' },
  { id: 'triceps', label: 'Triceps', scientificName: 'Triceps brachii', view: 'back' },
  { id: 'forearms', label: 'Forearms', scientificName: 'Forearm flexors and extensors', view: 'both' },
  { id: 'upper-abs', label: 'Upper abs', scientificName: 'Rectus abdominis', view: 'front' },
  { id: 'lower-abs', label: 'Lower abs', scientificName: 'Lower rectus abdominis', view: 'front' },
  { id: 'obliques', label: 'Obliques', scientificName: 'Internal and external obliques', view: 'front' },
  { id: 'traps', label: 'Traps', scientificName: 'Trapezius', view: 'both' },
  { id: 'upper-back', label: 'Upper back', scientificName: 'Rhomboids and mid trapezius', view: 'back' },
  { id: 'middle-back', label: 'Middle back', scientificName: 'Rhomboids and thoracic erectors', view: 'back' },
  { id: 'lats', label: 'Lats', scientificName: 'Latissimus dorsi', view: 'back' },
  { id: 'lower-back', label: 'Lower back', scientificName: 'Erector spinae', view: 'back' },
  { id: 'glutes', label: 'Glutes', scientificName: 'Gluteus maximus and medius', view: 'back' },
  { id: 'quadriceps', label: 'Quadriceps', scientificName: 'Quadriceps femoris', view: 'front' },
  { id: 'hamstrings', label: 'Hamstrings', scientificName: 'Hamstring group', view: 'back' },
  { id: 'calves', label: 'Calves', scientificName: 'Gastrocnemius and soleus', view: 'both' },
  { id: 'tibialis', label: 'Shins', scientificName: 'Tibialis anterior', view: 'front' },
  { id: 'hip-flexors', label: 'Hip flexors', scientificName: 'Iliopsoas', view: 'front' },
  { id: 'adductors', label: 'Adductors', scientificName: 'Hip adductor group', view: 'both' },
  { id: 'abductors', label: 'Abductors', scientificName: 'Gluteus medius and minimus', view: 'both' },
];

export const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map((muscle) => [muscle.id, muscle])) as Record<
  MuscleId,
  MuscleDefinition
>;
