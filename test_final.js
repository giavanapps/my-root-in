async function test() {
  // Test 1: ping gemini-2.5-flash
  console.log('=== Test ping gemini-2.5-flash ===');
  const t1 = Date.now();
  const r1 = await fetch('https://my-root-in-nine.vercel.app/api/ping?mode=apikey', { signal: AbortSignal.timeout(20000) });
  const j1 = await r1.json();
  console.log('Temps:', Math.round((Date.now()-t1)/1000)+'s');
  if (j1.generateTests) {
    j1.generateTests.forEach(t => console.log(`  ${t.model}: ${t.status} ${t.error||''}`));
  }

  // Test 2: saisie manuelle Got 2b Glue
  console.log('\n=== Test saisie manuelle: Got 2b Glue ===');
  const t2 = Date.now();
  const body = JSON.stringify({ manualBrand:'Schwarzkopf', manualName:'Got 2b Glue', manualType:'Gel', texture:'Crepus', porosity:'Moyenne' });
  const r2 = await fetch('https://my-root-in-nine.vercel.app/api/scan', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body,
    signal: AbortSignal.timeout(30000)
  });
  const elapsed = Math.round((Date.now()-t2)/1000);
  console.log('STATUS:', r2.status, '| Temps:', elapsed+'s');
  const j2 = await r2.json();
  if (r2.status === 200) {
    console.log('brand:', j2.brand);
    console.log('score:', j2.score);
    console.log('title:', j2.title);
    console.log('=> SUCCES ! API fonctionnelle.');
  } else {
    console.log('ERREUR:', JSON.stringify(j2).substring(0,300));
  }
}

test().catch(e => console.log('ECHEC global:', e.message));
