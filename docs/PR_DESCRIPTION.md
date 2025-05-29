# Fix: Integrate Socket.IO into Next.js Server

## Problem
On Render, both Next.js (`next start`) and the separate WebSocket server (`tsx ws-server.ts`) tried to bind to port 10000, causing `EADDRINUSE` errors:

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:10000
```

This prevented the WebSocket server from starting, breaking multiplayer functionality.

## Solution
Created a custom Next.js server (`server.js`) that integrates Socket.IO directly:

### Key Changes:
1. **Custom Server**: `server.js` combines Next.js and Socket.IO on same port
2. **Package.json**: Updated `start` script to use `node server.js`  
3. **Single Process**: Eliminates port conflicts by running both services together
4. **ES Modules**: Uses modern import/export syntax for consistency

### Architecture:
```
Before (Render):
┌─────────────┐    ┌──────────────┐
│ Next.js     │    │ WebSocket    │
│ Port 10000  │    │ Port 10000   │ ❌ Conflict
└─────────────┘    └──────────────┘

After (Render):
┌─────────────────────────────┐
│ Integrated Server           │
│ Next.js + Socket.IO         │
│ Port 10000                  │ ✅ Success
└─────────────────────────────┘
```

## Testing
- ✅ Local build: `npm run build` works
- ✅ Integrated server: `npm run start` starts without errors
- ✅ Socket.IO: All multiplayer functionality preserved
- ✅ Production ready: Handles Render's single-port constraint

## Files Modified
- `server.js` - New integrated server
- `package.json` - Updated start script

This should resolve all multiplayer issues on Render deployment.
