async function test(mode) {
  const t = Date.now();
  console.log(`\n=== Test mode: ${mode} ===`);
  try {
    const r = await fetch(`https://my-root-in-nine.vercel.app/api/ping?mode=${mode}`, {
      signal: AbortSignal.timeout(30000)
    });
    const elapsed = Math.round((Date.now()-t)/1000);
    console.log('Status:', r.status, '| Temps:', elapsed+'s');
    const j = await r.json();
    console.log('keyInfo:', j.keyInfo);
    console.log('listModels:', JSON.stringify(j.listModels).substring(0, 200));
    if (j.generateTests) {
      j.generateTests.forEach(t => {
        console.log(`  ${t.model}: status=${t.status || 'ERR'} ${t.error || ''} body=${(t.body||'').substring(0,100)}`);
      });
    }
  } catch(e) { console.log('ECHEC:', e.message); }
}

(async () => {
  await test('apikey');
  await test('bearer');
})();
