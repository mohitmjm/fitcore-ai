import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { exercises, goal, experience, language } = await request.json();

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: 'An array of exercises is required for progression scaling' },
        { status: 400 }
      );
    }

    let languageDirective = "";
    if (language === 'hinglish') {
      languageDirective = " Ensure all new tips are written in Hinglish (e.g. 'Rep count badhayein aur tension hold karein').";
    }

    const prompt = `You are a professional fitness coach. You need to apply progressive overload (intensity progression) to the following exercises. Make them slightly more challenging by either:
1. Increasing reps slightly (e.g., if 8 reps, make it 10; if "8-10", make it "10-12").
2. Adjusting sets (e.g., from 3 to 4, max 5).
3. Modifying tips to outline progressive targets (e.g., adding weight progression, slower negatives).
Keep the exercise names exactly the same.
Current Goal: ${goal}
Current Experience Level: ${experience}
Exercises to scale: ${JSON.stringify(exercises)}
${languageDirective}
Return ONLY a JSON array containing the progressed exercise objects. Maintain the exact same keys: "name", "sets", "reps", "rest_seconds", "muscle_group", "tip". Do not include any formatting, markdown, or commentary.`;

    const rawResponse = await callAI(prompt, 'json');

    let progressedExercises;
    try {
      const sanitized = rawResponse.replace(/```json|```/g, '').trim();
      progressedExercises = JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("JSON parsing failed, attempting extract:", rawResponse);
      const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        progressedExercises = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return NextResponse.json({
      success: true,
      exercises: progressedExercises,
      coachNote: language === 'hinglish' 
        ? '⚡ AI Progression loaded! Sets/Reps parameters badha diye hain progressive overload ke liye. Chalo smash karein!'
        : '⚡ AI Progression active! Increased intensity metrics loaded for progressive overload. Go crush it!'
    });

  } catch (error: any) {
    console.error("Workout progression API failed:", error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
