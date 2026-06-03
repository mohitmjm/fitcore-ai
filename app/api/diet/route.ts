import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { diet_type, goal, weight_kg, height_cm, allergies, meals_per_day, userId } = await request.json();
    
    if (!diet_type || !goal || !weight_kg || !height_cm) {
      return NextResponse.json({ error: 'Missing diet parameters' }, { status: 400 });
    }

    const allergiesStr = (allergies && allergies.length > 0) ? allergies.join(', ') : 'none';

    const prompt = `You are a certified nutritionist. Create a 7-day Indian meal plan for a ${weight_kg}kg, ${height_cm}cm person. Goal: ${goal}. Diet: ${diet_type}. Allergies: ${allergiesStr}. Return ONLY JSON as a JSON array of 7 items (days), where each day has: "day" (string, e.g. "Monday"), "breakfast" (object), "lunch" (object), "dinner" (object), "snacks" (object). Each meal object must contain fields: "name" (string), "calories" (number), "protein_g" (number), "carbs_g" (number), "fat_g" (number). Do not include conversational text or markdown code fences.`;

    const rawResponse = await callAI(prompt, 'json');
    
    let planData;
    try {
      const sanitized = rawResponse.replace(/```json|```/g, '').trim();
      planData = JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("JSON parsing for diet plan failed, attempting recovery on raw:", rawResponse);
      try {
        const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not extract diet array");
        }
      } catch (nestedError) {
        return NextResponse.json({ 
          error: 'Failed to generate perfectly formatted diet plan JSON from model. Please try again.',
          raw: rawResponse 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ plan: planData });
  } catch (error: any) {
    console.error("Diet API route failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
