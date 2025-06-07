// server.js - Custom server for Next.js backend
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Create data directory for SQLite if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory for SQLite database');
}

// Define environment
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare the app
app.prepare().then(() => {
  // Create HTTP server
  createServer(async (req, res) => {
    try {
      // Parse request URL
      const parsedUrl = parse(req.url, true);
      
      // Add health check endpoint for Sevalla
      if (parsedUrl.pathname === '/api/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // Let Next.js handle all other requests
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    
    // Log environment info
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Database path: ${process.env.DB_PATH || path.join(dataDir, 'chatbot.sqlite')}`);
    
    // Ready!
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
