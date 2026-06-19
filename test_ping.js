const t = Date.now();
console.log('Test ping Gemini depuis Vercel Edge...');
fetch('https://my-root-in-nine.vercel.app/api/ping', {
  signal: AbortSignal.timeout(15000)
}).then(async r => {
  console.log('Status:', r.status, '| Temps:', Math.round((Date.now()-t)/1000)+'s');
  console.log('Result:', await r.text());
}).catch(e => console.log('ECHEC:', e.message));
