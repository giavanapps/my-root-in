export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'NO_KEY' }), { status: 500, headers: CORS });
  }

  const keyInfo = { length: apiKey.length, prefix: apiKey.substring(0, 10) + '...' };
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'apikey';

  const results: any = { keyInfo, mode };

  // Test 1: List available models
  try {
    const listUrl = mode === 'bearer'
      ? 'https://generativelanguage.googleapis.com/v1beta/models'
      : `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const headers: any = { 'Content-Type': 'application/json' };
    if (mode === 'bearer') headers['Authorization'] = `Bearer ${apiKey}`;

    const r = await fetch(listUrl, { headers, signal: AbortSignal.timeout(8000) });
    const body = await r.text();
    results.listModels = { status: r.status, body: body.substring(0, 300) };
  } catch (e: any) {
    results.listModels = { error: e.message };
  }

  // Test 2: Generate content with flash
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
  results.generateTests = [];

  for (const model of models) {
    try {
      const genUrl = mode === 'bearer'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const headers: any = { 'Content-Type': 'application/json' };
      if (mode === 'bearer') headers['Authorization'] = `Bearer ${apiKey}`;

      const start = Date.now();
      const r = await fetch(genUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say: {"ok":true}' }] }], generationConfig: { responseMimeType: 'application/json' } }),
        signal: AbortSignal.timeout(8000)
      });
      const body = await r.text();
      results.generateTests.push({ model, status: r.status, ms: Date.now() - start, body: body.substring(0, 200) });
      if (r.ok) break; // found working model
    } catch (e: any) {
      results.generateTests.push({ model, error: e.message });
    }
  }

  return new Response(JSON.stringify(results, null, 2), { status: 200, headers: CORS });
}
