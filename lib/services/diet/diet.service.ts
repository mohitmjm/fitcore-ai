import type { ObjectId, OptionalUnlessRequiredId } from 'mongodb';
import { getCollection } from '@/lib/db/repository';
import { runAITask } from '@/lib/ai/router';
import { UsersService } from '@/lib/services/users/users.service';

const DIET = 'diet_plans';

export interface DietMeal {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
export interface DietDay {
  day: string;
  breakfast: DietMeal;
  lunch: DietMeal;
  dinner: DietMeal;
  snacks: DietMeal;
}
export interface DietPlanDoc {
  _id?: ObjectId;
  clerkUserId: string;
  weekOf: string;
  days: DietDay[];
  generatedBy: 'ai' | 'fallback';
  version: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RawMeal {
  name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}
interface RawDietDay {
  day?: string | number;
  breakfast?: RawMeal;
  lunch?: RawMeal;
  dinner?: RawMeal;
  snacks?: RawMeal;
}

function meal(raw: RawMeal | undefined, fallbackName: string): DietMeal {
  return {
    name: raw?.name ?? fallbackName,
    calories: typeof raw?.calories === 'number' ? raw.calories : 0,
    protein_g: typeof raw?.protein_g === 'number' ? raw.protein_g : 0,
    carbs_g: typeof raw?.carbs_g === 'number' ? raw.carbs_g : 0,
    fat_g: typeof raw?.fat_g === 'number' ? raw.fat_g : 0,
  };
}

function parseDiet(raw: string): DietDay[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return (data as RawDietDay[]).map((d, i) => ({
      day: String(d.day ?? `Day ${i + 1}`),
      breakfast: meal(d.breakfast, 'Breakfast'),
      lunch: meal(d.lunch, 'Lunch'),
      dinner: meal(d.dinner, 'Dinner'),
      snacks: meal(d.snacks, 'Snack'),
    }));
  } catch {
    return [];
  }
}

function weekStart(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export const DietService = {
  async generate(clerkUserId: string): Promise<DietPlanDoc> {
    const user = await UsersService.getByClerkId(clerkUserId);
    const dietType = user?.profile?.dietType ?? 'non_veg';
    const goal = user?.profile?.goal ?? 'maintain';
    const weight = user?.profile?.weightKg ?? 70;

    const prompt = `Generate a 7-day Indian meal plan. diet: ${dietType} goal: ${goal} for a ${weight}kg person. Return ONLY a JSON array of 7 days; each day has "day", "breakfast", "lunch", "dinner", "snacks" (each meal: name, calories, protein_g, carbs_g, fat_g).`;

    const raw = await runAITask('plan_json', prompt, { json: true });
    const parsed = parseDiet(raw);
    const generatedBy: DietPlanDoc['generatedBy'] = parsed.length > 0 ? 'ai' : 'fallback';

    const doc: DietPlanDoc = {
      clerkUserId,
      weekOf: weekStart(),
      days: parsed,
      generatedBy,
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const coll = await getCollection<DietPlanDoc>(DIET);
    await coll.insertOne(doc as unknown as OptionalUnlessRequiredId<DietPlanDoc>);
    return doc;
  },

  async getCurrent(clerkUserId: string): Promise<DietPlanDoc | null> {
    const coll = await getCollection<DietPlanDoc>(DIET);
    const arr = await coll
      .find({ clerkUserId, isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    return (arr[0] as DietPlanDoc) ?? null;
  },
};
