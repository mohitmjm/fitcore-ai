import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { ingredients, targetGoal, language } = await request.json();
    
    if (!ingredients) {
      return NextResponse.json({ error: 'Missing ingredients list' }, { status: 400 });
    }

    let languageDirective = "";
    if (language === 'hinglish') {
      languageDirective = " Crucial Requirement: All recipe instructions (the 'instructions' array field in the JSON) must be written in Hinglish (Hindi words written in the English/Latin alphabet, for example: '1. Paneer ko small pieces me cut karein', '2. Pan me thoda ghee dal kar saute karein'). Keep the recipe name and ingredients labels clear.";
    }

    const prompt = `You are a certified nutritionist. Create a healthy recipe using some or all of these ingredients: "${ingredients}". The target goal is: "${targetGoal}".${languageDirective} Return ONLY a JSON object with these fields: "recipeName" (string), "calories" (number), "protein_g" (number), "carbs_g" (number), "fat_g" (number), "prep_time_minutes" (number), and "instructions" (array of strings). Do not include any conversation, markdown tags, or extra text.`;

    const rawResponse = await callAI(prompt, 'json');
    
    let recipeData;
    try {
      const sanitized = rawResponse.replace(/```json|```/g, '').trim();
      recipeData = JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("JSON parsing for recipe failed, recovering on raw:", rawResponse);
      try {
        const jsonMatch = rawResponse.match(/\{\s*[\s\S]*\s*\}/);
        if (jsonMatch) {
          recipeData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not extract recipe object");
        }
      } catch (nestedError) {
        return NextResponse.json({ 
          error: 'Failed to generate perfectly formatted recipe JSON from model. Please try again.',
          raw: rawResponse 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ recipe: recipeData });
  } catch (error: any) {
    console.error("Fridge Recipe API route failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
