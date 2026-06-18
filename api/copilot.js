const https = require('https');

module.exports = async (req, res) => {
  // CORS Headers for serverless response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse messages from request body (automatically parsed by Vercel)
  const messages = req.body && req.body.messages;
  if (!messages) {
    return res.status(400).json({ error: 'Missing messages in request body.' });
  }

  // Fetch Groq API Key from environment variables (configured in Vercel dashboard)
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API Key is not configured in Vercel environment variables.' });
  }

  try {
    const postData = JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: messages,
      temperature: 0.2
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.status(proxyRes.statusCode).send(body);
      });
    });

    proxyReq.on('error', (e) => {
      console.error("Groq Proxy Error:", e);
      res.status(500).json({ error: 'Failed to communicate with LLM gateway: ' + e.message });
    });

    proxyReq.write(postData);
    proxyReq.end();

  } catch (err) {
    console.error("Serverless proxy error:", err);
    res.status(500).json({ error: 'Serverless execution error: ' + err.message });
  }
};
