// Test 1: POST sans corps valide -> 400 instantane (sans appeler Gemini)
const t1 = Date.now();
console.log('Test 1: validation sans Gemini...');
fetch('https://my-root-in-nine.vercel.app/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ texture: 'Crepus' }),
  signal: AbortSignal.timeout(5000)
}).then(async r => {
  console.log('Test1 Status:', r.status, '| Temps:', Date.now()-t1+'ms');
  console.log('Test1 Body:', await r.text());
  
  // Test 2: Gemini directement avec la cle depuis l'env
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log('Test2: PAS DE CLE GEMINI EN ENV LOCAL - skip');
    return;
  }
  console.log('Test2: Gemini direct, cle longueur:', key.length);
  const t2 = Date.now();
  return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key='+key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reponds uniquement: {"ok":true}' }] }],
      generationConfig: { responseMimeType: 'application/json' }
    }),
    signal: AbortSignal.timeout(12000)
  }).then(async r2 => {
    console.log('Test2 Gemini status:', r2.status, '| Temps:', Math.round((Date.now()-t2)/1000)+'s');
    console.log('Test2 Body:', (await r2.text()).substring(0, 300));
  });
}).catch(e => console.log('ECHEC:', e.message));
