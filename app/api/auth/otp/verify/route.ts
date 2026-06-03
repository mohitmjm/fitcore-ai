import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    // Verify
    const isValid = verifyOTP(trimmedEmail, trimmedOtp);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully'
    });
  } catch (error: any) {
    console.error('Verify OTP API failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
