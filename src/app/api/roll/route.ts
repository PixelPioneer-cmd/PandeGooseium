import { NextResponse } from 'next/server';

export function GET() {
  const roll = Math.floor(Math.random() * 3) + 1;
  return NextResponse.json({ roll });
}