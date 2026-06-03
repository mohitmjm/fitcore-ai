import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { days, experience, goal, equipment, userId, language } = await request.json();
    
    if (!days || !experience || !goal || !equipment) {
      return NextResponse.json({ error: 'Missing required configuration parameters' }, { status: 400 });
    }

    let languageDirective = "";
    if (language === 'hinglish') {
      languageDirective = " Crucial Requirement: All exercise tips (the 'tip' field in the JSON) must be written in Hinglish (Hindi words written in the English/Latin alphabet, for example: 'Back straight rakhein aur slowly perform karein'). Keep the exercise names in standard English.";
    }

    const prompt = `You are a professional fitness coach. Generate a ${days}-day workout plan for a ${experience} level person with goal: ${goal}, equipment: ${equipment}.${languageDirective} Return ONLY a JSON array where each item has: "day" (string, e.g. "Day 1"), and "exercises" (array of objects, each with fields: "name" (string), "sets" (number), "reps" (string or number, e.g. 10 or "12-15"), "rest_seconds" (number), "muscle_group" (string), "tip" (string)). Do not include any conversation, markdown tags, or extra text.`;

    const rawResponse = await callAI(prompt, 'json');
    
    // Attempt to parse JSON response. Occasionally models return backticks or wrapping, let's sanitize it.
    let planData;
    try {
      const sanitized = rawResponse.replace(/```json|```/g, '').trim();
      planData = JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("JSON parsing failed, returning raw response content:", rawResponse);
      // Fallback parse attempt
      try {
        const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not extract JSON array");
        }
      } catch (nestedError) {
        // Return dummy parse error fallback
        return NextResponse.json({ 
          error: 'Failed to generate perfectly formatted JSON from AI model. Please try again.',
          raw: rawResponse 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ plan: planData });
  } catch (error: any) {
    console.error("Workout API route failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
