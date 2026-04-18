import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Create a clean session for admin user
    const session = {
      user: { name: 'Admin', email: 'admin@school.com', role: 'admin', id: '1' },
      accessToken: 'clean-admin-session',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });
  }
}
