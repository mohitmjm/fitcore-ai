import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { message, history, language } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    let systemInstructions = "You are a professional, motivating fitness and nutrition coach. Answer the user's questions clearly, accurately, and encouragingly. Always reply in English.";
    
    if (language === 'hinglish') {
      systemInstructions = "You are a professional, motivating fitness and nutrition coach. Answer the user's questions clearly, accurately, and encouragingly. Crucial Language Requirement: You MUST reply in Hinglish (Hindi written using the English/Latin alphabet, for example: 'Kaise ho? Aaj workout kiya? Workout ke baad protein intake badhao aur hydration ka dhyan rakho'). Keep formatting clean.";
    }

    // Build chat history context for the prompt
    let context = `${systemInstructions}\n\n`;
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        context += `${msg.sender === 'user' ? 'User' : 'Coach'}: ${msg.message}\n`;
      });
    }
    
    context += `User: ${message}\nCoach:`;

    const rawResponse = await callAI(context);
    
    // Clean response in case it returns JSON wrapper or code block (since callAI is configured with JSON format, let's parse or extract text)
    let reply = rawResponse;
    try {
      // In case callAI returned formatted json because of Ollama configuration:
      const parsed = JSON.parse(rawResponse);
      if (parsed.response) {
        reply = parsed.response;
      } else if (parsed.message) {
        reply = parsed.message;
      }
    } catch {
      // It was plain text or not standard json, use it raw
    }

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    console.error("Chat API route failed:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
