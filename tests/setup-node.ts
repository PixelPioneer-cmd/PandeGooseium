// Jest setup for Node.js tests (API, integration, utils)

// Mock pour les variables d'environnement
if (!process.env.NEXT_PUBLIC_WS_SERVER) {
  process.env.NEXT_PUBLIC_WS_SERVER = 'ws://localhost:4000';
}

// Simplification des mocks pour Request et Response
export {}; // Ensure this file is treated as a module

declare global {
  interface GlobalThis {
    NextRequest: typeof Request;
    NextResponse: typeof Response;
  }
}

class MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
  bodyUsed: boolean;

  constructor(input: string, init: RequestInit = {}) {
    this.url = input;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body ? String(init.body) : null;
    this.bodyUsed = false;
  }

  async json(): Promise<unknown> {
    this.bodyUsed = true;
    return JSON.parse(this.body || '{}');
  }

  async text(): Promise<string> {
    this.bodyUsed = true;
    return this.body || '';
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    this.bodyUsed = true;
    return new TextEncoder().encode(this.body || '').buffer as ArrayBuffer;
  }

  async blob(): Promise<Blob> {
    this.bodyUsed = true;
    return new Blob([this.body || '']);
  }

  clone(): MockRequest {
    return new MockRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body || undefined,
    });
  }
}

class MockResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: string | null;
  bodyUsed: boolean;

  constructor(body: string | null = null, init: ResponseInit = {}) {
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers);
    this.body = body;
    this.bodyUsed = false;
  }

  async json(): Promise<unknown> {
    this.bodyUsed = true;
    return JSON.parse(this.body || '{}');
  }

  async text(): Promise<string> {
    this.bodyUsed = true;
    return this.body || '';
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    this.bodyUsed = true;
    return new TextEncoder().encode(this.body || '').buffer as ArrayBuffer;
  }

  async blob(): Promise<Blob> {
    this.bodyUsed = true;
    return new Blob([this.body || '']);
  }

  clone(): MockResponse {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
}

Object.defineProperty(globalThis, 'NextRequest', {
  value: MockRequest,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'NextResponse', {
  value: MockResponse,
  writable: true,
  configurable: true,
});
