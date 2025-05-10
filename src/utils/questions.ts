import { readFileSync } from 'fs';
import { join } from 'path';
import { levenshtein } from './levenshtein';

const questions: Record<string, { question: string; answer: string; level: string }> =
  JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'questions.json'), 'utf-8')
  );

export function getQuestion(caseNum: number): { question: string; level: string } | null {
  const entry = questions[String(caseNum)];
  if (!entry) return null;
  return { question: entry.question, level: entry.level };
}

export function validateAnswer(caseNum: number, input: string): { correct: boolean; correctAnswer: string; distance: number; maxDist: number } {
  const entry = questions[String(caseNum)];
  if (!entry) throw new Error('Case non trouvée');
  const target = entry.answer.trim().toLowerCase();
  const answer = input.trim().toLowerCase();
  const distance = levenshtein(answer, target);
  const maxDist = Math.max(1, Math.floor(target.length * 0.2));
  const correct = distance <= maxDist;
  return { correct, correctAnswer: entry.answer, distance, maxDist };
}