require('dotenv').config({ path: '.env.test' });
const key = process.env.GEMINI_API_KEY;
if (!key) { console.log('CLE MANQUANTE'); process.exit(1); }
console.log('Cle trouvee, longueur:', key.length, '| debut:', key.substring(0, 12) + '...');

const start = Date.now();
console.log('Test Gemini flash-lite direct...');

fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + key, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Say hello in JSON: {"hello":"world"}' }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 }
    }
  }),
  signal: AbortSignal.timeout(15000)
}).then(async r => {
  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log('Gemini STATUS:', r.status, '| Temps:', elapsed + 's');
  const txt = await r.text();
  console.log('Reponse brute:', txt.substring(0, 400));
}).catch(e => {
  console.log('GEMINI ECHEC:', e.message);
  console.log('Cause:', e.cause?.code || e.cause?.message || '');
});
