import { getQuestion, validateAnswer } from '../../src/utils/questions';

describe('questions utils', () => {
  test('getQuestion returns correct data for existing case', () => {
    const result = getQuestion(1);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('question');
    expect(result).toHaveProperty('level', 'facile');
    expect(result?.question).toMatch(/dieu des Enfers/i);
  });

  test('getQuestion returns null for non-existing case', () => {
    expect(getQuestion(999)).toBeNull();
  });

  test('validateAnswer correct for exact match', () => {
    const { correct, correctAnswer } = validateAnswer(1, 'Hadès');
    expect(correct).toBe(true);
    expect(correctAnswer).toBe('Hadès');
  });

  test('validateAnswer correct for case-insensitive match', () => {
    const { correct } = validateAnswer(1, 'hadès');
    expect(correct).toBe(true);
  });

  test('validateAnswer correct for minor typo', () => {
    const { correct } = validateAnswer(1, 'hades');
    expect(correct).toBe(true);
  });

  test('validateAnswer false for major typo', () => {
    const { correct } = validateAnswer(1, 'xyz');
    expect(correct).toBe(false);
  });

  test('validateAnswer throws for invalid case', () => {
    expect(() => validateAnswer(999, 'test')).toThrow(/Case non trouvée/);
  });
});