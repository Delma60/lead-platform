import { NextRequest, NextResponse } from 'next/server';
import { createSession, passwordMatches, sessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD || !process.env.AUTH_SECRET) return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 });
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (typeof body?.password !== 'string' || !(await passwordMatches(body.password))) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(sessionCookie, await createSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}
