import { NextResponse } from 'next/server';
import { generateOTP, sendOTPEmail, isEmailRegistered } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if email already registered
    if (isEmailRegistered(trimmedEmail)) {
      return NextResponse.json(
        { error: 'This email is already registered. Please Sign In using your username/email and password.' },
        { status: 400 }
      );
    }
    
    // Generate code
    const otp = generateOTP(trimmedEmail);

    // Send code via Resend or log to CLI Console
    const sendResult = await sendOTPEmail(trimmedEmail, otp);

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Failed to dispatch verification email' },
        { status: 500 }
      );
    }

    const isDev = process.env.NODE_ENV === 'development';
    const isMockOrNoKey = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'YOUR_RESEND_KEY';

    return NextResponse.json({
      success: true,
      // If we are in dev mode or using the local CLI console fallback, expose the OTP code for easy UI testing
      devMode: isDev,
      ...(isDev ? { code: otp } : {}),
      mockMode: isMockOrNoKey,
      message: isMockOrNoKey 
        ? 'Dev Mode: OTP logged to server terminal console' 
        : 'OTP code dispatched to your email address'
    });
  } catch (error: any) {
    console.error('Send OTP API failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
