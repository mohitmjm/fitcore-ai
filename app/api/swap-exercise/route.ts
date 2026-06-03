import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { exerciseName, muscleGroup, goal, language } = await request.json();
    
    if (!exerciseName || !muscleGroup) {
      return NextResponse.json({ error: 'Missing exercise details' }, { status: 400 });
    }

    let languageDirective = "";
    if (language === 'hinglish') {
      languageDirective = " Crucial Requirement: All exercise tips (the 'tip' field in the JSON) must be written in Hinglish (Hindi words written in the English/Latin alphabet, for example: 'Chest up rakhein aur shoulders ko relax rakhein'). Keep exercise names in standard English.";
    }

    const prompt = `You are a professional fitness coach. Generate 3 biomechanically equivalent exercise alternatives for: "${exerciseName}" which targets "${muscleGroup}" muscles. The user's goal is: "${goal}".${languageDirective} Return ONLY a JSON array where each item has: "name" (string), "sets" (number), "reps" (string or number), "rest_seconds" (number), "type" (string: 'Free Weight', 'Machine/Cable', or 'Bodyweight/Joint-Friendly'), and "tip" (string). Do not include any conversation, markdown tags, or extra text.`;

    const rawResponse = await callAI(prompt, 'json');
    
    let swapData;
    try {
      const sanitized = rawResponse.replace(/```json|```/g, '').trim();
      swapData = JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("JSON parsing for exercise swap failed, recovering on raw:", rawResponse);
      try {
        const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          swapData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not extract swap array");
        }
      } catch (nestedError) {
        return NextResponse.json({ 
          error: 'Failed to generate perfectly formatted swap alternatives from model. Please try again.',
          raw: rawResponse 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ alternatives: swapData });
  } catch (error: any) {
    console.error("Swap Exercise API route failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
