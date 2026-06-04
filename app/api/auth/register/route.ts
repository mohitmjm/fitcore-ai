import { NextResponse } from 'next/server';
import { registerUser, isUsernameRegistered } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password, ...profileData } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, Username, and Password are all required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    // Check if username already exists
    if (isUsernameRegistered(cleanUsername)) {
      return NextResponse.json(
        { error: 'Username is already taken. Please try another one.' },
        { status: 400 }
      );
    }

    // Register user in mock server-side database
    const newUser = registerUser(cleanEmail, cleanUsername, cleanPassword, profileData);

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      user: newUser
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
