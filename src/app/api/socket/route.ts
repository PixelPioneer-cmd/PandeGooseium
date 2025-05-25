// Next.js API Route for Socket.IO endpoint
// Note: Actual Socket.IO server initialization is handled in server.js

export async function GET() {
  // This route is used by clients to check if the Socket.IO endpoint is available
  return new Response(JSON.stringify({ 
    message: 'Socket.IO endpoint ready',
    status: 'ok',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
