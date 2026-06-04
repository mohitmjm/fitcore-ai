import { NextResponse } from 'next/server';
import { readUsers, writeUsers } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, ...profileData } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required to update profile' },
        { status: 400 }
      );
    }

    const lowerUsername = username.trim().toLowerCase();
    const users = readUsers();

    if (!users[lowerUsername]) {
      return NextResponse.json(
        { error: 'User profile not found in server database' },
        { status: 404 }
      );
    }

    // Merge updated profile data, preserving the username, email, and password
    users[lowerUsername] = {
      ...users[lowerUsername],
      ...profileData,
      username: users[lowerUsername].username,
      email: users[lowerUsername].email,
      password: users[lowerUsername].password
    };

    writeUsers(users);

    return NextResponse.json({
      success: true,
      message: 'User profile successfully synchronized on server',
      user: users[lowerUsername]
    });
  } catch (error: any) {
    console.error('Server profile update failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
