import { GET as rollGET } from './route';
// Node.js 18+ global Request exists

describe('API /api/roll', () => {
  test('retourne un nombre aléatoire entre 1 et 3', async () => {
    const res = rollGET();
    // NextResponse.json par défaut status 200
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.roll).toBe('number');
    expect(data.roll).toBeGreaterThanOrEqual(1);
    expect(data.roll).toBeLessThanOrEqual(3);
  });
});