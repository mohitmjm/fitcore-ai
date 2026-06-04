import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const { loginId, password } = await request.json();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Username/Email and Password are required' },
        { status: 400 }
      );
    }

    const cleanId = loginId.trim();
    const cleanPassword = password.trim();

    // Authenticate
    const user = authenticateUser(cleanId, cleanPassword);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid Username/Email or Password. Please try again.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user
    });
  } catch (error: any) {
    console.error('Login authentication failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
