import { NextRequest, NextResponse } from 'next/server';
import { sessionCookie, verifySession } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const authenticated = await verifySession(request.cookies.get(sessionCookie)?.value);
  if (authenticated) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const login = new URL('/login', request.url);
  login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = { matcher: ['/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)'] };

