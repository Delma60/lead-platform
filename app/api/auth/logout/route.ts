import { NextResponse } from 'next/server';
import { sessionCookie } from '@/lib/auth';
export async function POST() { const response = NextResponse.json({ authenticated: false }); response.cookies.set(sessionCookie, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 }); return response; }

