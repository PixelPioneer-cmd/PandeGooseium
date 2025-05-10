import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { levenshtein } from '@/utils/levenshtein';

async function loadQuestions() {
  const filePath = path.join(process.cwd(), 'data', 'questions.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ case: string }> }
) {
  const { case: num } = await context.params;
  const questions = await loadQuestions();
  const entry = questions[num];
  if (!entry) {
    return NextResponse.json({ error: 'Case non trouvée' }, { status: 404 });
  }
  const { question, level } = entry;
  return NextResponse.json({ case: num, question, level });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ case: string }> }
) {
  const { case: num } = await context.params;
  const questions = await loadQuestions();
  const entry = questions[num];
  if (!entry) {
    return NextResponse.json({ error: 'Case non trouvée' }, { status: 404 });
  }
  const body = await req.json();
  const input = (body.answer || '').trim().toLowerCase();
  const target = (entry.answer || '').trim().toLowerCase();
  const dist = levenshtein(input, target);
  const maxDist = Math.max(1, Math.floor(target.length * 0.2));
  const correct = dist <= maxDist;
  return NextResponse.json({ correct, distance: dist, correctAnswer: entry.answer });
}