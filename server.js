const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// Read Groq API Key from .env
function getGroqApiKey() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const matchKey = content.match(/GROQ_API_KEY\s*=\s*(.*)/);
      if (matchKey) {
        return matchKey[1].trim().replace(/['"]/g, ''); // strip optional quotes
      }
    }
  } catch (err) {
    console.error("Error reading .env file:", err);
  }
  // Fallback
  return process.env.GROQ_API_KEY || '';
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. CRM Copilot Proxy Endpoint to Groq API
  if (req.method === 'POST' && parsedUrl.pathname === '/api/copilot') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const apiKey = getGroqApiKey();

        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "GROQ_API_KEY not found in .env" }));
          return;
        }

        const groqPayload = JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: payload.messages || [],
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null
        });

        const options = {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(groqPayload)
          }
        };

        const groqReq = https.request(options, (groqRes) => {
          let responseData = '';
          groqRes.on('data', chunk => {
            responseData += chunk;
          });
          groqRes.on('end', () => {
            res.writeHead(groqRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(responseData);
          });
        });

        groqReq.on('error', (err) => {
          console.error("Groq API connection error:", err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Groq connection failure: ${err.message}` }));
        });

        groqReq.write(groqPayload);
        groqReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Invalid request payload: ${err.message}` }));
      }
    });
    return;
  }

  // 2. Serve Static Resources
  if (req.method === 'GET') {
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
    
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.exists(filePath, (exists) => {
      if (!exists) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` Martinoz Franchise Intelligence Platform Server Online`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Close terminal or press Ctrl+C to terminate server`);
  console.log(`======================================================\n`);
});
