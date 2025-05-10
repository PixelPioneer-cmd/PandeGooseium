import { GET, POST } from './route';

describe('API /api/question/[case]', () => {
  test('GET retourne question et niveau pour case existante', async () => {
    const res = await GET(new Request('http://localhost', { method: 'GET' }), { params: Promise.resolve({ case: '1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('case', '1');
    expect(data).toHaveProperty('question');
    expect(data).toHaveProperty('level', 'facile');
  });

  test('GET renvoie 404 pour case inexistante', async () => {
    const res = await GET(new Request('http://localhost', { method: 'GET' }), { params: Promise.resolve({ case: '999' }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error', 'Case non trouvée');
  });

  test('POST valide une bonne réponse', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'Hadès' })
    });
    const res = await POST(request, { params: Promise.resolve({ case: '1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.correct).toBe(true);
    expect(data).toHaveProperty('correctAnswer', 'Hadès');
  });

  test('POST détecte une mauvaise réponse et recule', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'xyz' })
    });
    const res = await POST(request, { params: Promise.resolve({ case: '1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.correct).toBe(false);
    expect(data).toHaveProperty('correctAnswer', 'Hadès');
  });
});