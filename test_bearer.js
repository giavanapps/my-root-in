// Teste la cle Gemini via ping endpoint en mode Bearer
const t = Date.now();
console.log('=== Test Bearer token ===');
fetch('https://my-root-in-nine.vercel.app/api/ping?mode=bearer', {
  signal: AbortSignal.timeout(10000)
}).then(async r => {
  console.log('Status:', r.status, '| Temps:', Date.now()-t+'ms');
  console.log(await r.text());
}).catch(e => console.log('ECHEC:', e.message));
