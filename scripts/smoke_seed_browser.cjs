/* Optional acceptance test. Requires Playwright + Chromium in the caller's runtime.
 * NODE_PATH=/runtime/node_modules node scripts/smoke_seed_browser.cjs URL /tmp/screens
 * Targets the public app or a local read-only server; no account/game writes.
 */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const base=(process.argv[2]||'http://127.0.0.1:8765').replace(/\/$/,''),out=process.argv[3];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,colorScheme:'light'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  if(out)await fs.mkdir(out,{recursive:true});
  await page.goto(base+'/#plan',{waitUntil:'networkidle'});
  await page.locator('#seedInvestmentPanel .seed-panel').waitFor();
  assert.equal(await page.locator('[data-seed-field="individual"] option').count(),35);
  assert.equal(await page.locator('[data-seed-field="target"]').inputValue(),'');
  assert.match(await page.locator('#seedInvestmentPanel').innerText(),/2026-09-28の概数/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const unchanged=await page.evaluate(()=>JSON.stringify([window.APP_DATA,window.SEED_INVESTMENT_DATA]));
  const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
  await page.selectOption('[data-seed-field="target"]','6');
  assert.match(await page.locator('.seed-reference').first().innerText(),/3個/);
  assert.match(await page.locator('.seed-reference').first().innerText(),/9 → 18/);
  await page.locator('#seedInvestmentPanel').scrollIntoViewIfNeeded();
  if(out)await page.screenshot({path:path.join(out,'seed-mobile-light.png'),fullPage:true});
  await page.selectOption('[data-seed-field="individual"]','IND-0010');
  assert.equal(await page.locator('[data-seed-field="target"]').inputValue(),'');
  await page.selectOption('[data-seed-field="target"]','7');
  assert.match(await page.locator('.seed-reference').first().innerText(),/4個/);
  assert.match(await page.locator('.seed-reference').first().innerText(),/1726 → 6858/);
  await page.emulateMedia({colorScheme:'dark'});
  if(out)await page.screenshot({path:path.join(out,'seed-mobile-dark.png'),fullPage:true});
  await page.selectOption('[data-seed-field="individual"]','IND-0017');
  assert.match(await page.locator('.seed-layers').first().innerText(),/進化先 パーモット/);
  await page.selectOption('[data-seed-field="individual"]','IND-0009');
  assert.equal(await page.locator('[data-seed-field="target"]').count(),0);
  assert.match(await page.locator('.seed-reference').first().innerText(),/未算出/);
  await page.locator('.seed-catalog summary').click();
  assert.equal(await page.locator('.seed-species-list>li').count(),8);
  const individualIds=await page.locator('[data-seed-field="individual"] option').evaluateAll(options=>options.map(o=>o.value));
  let calculableIndividuals=0;
  for(const id of individualIds){
   await page.selectOption('[data-seed-field="individual"]',id);
   assert.equal(await page.locator('#seedInvestmentPanel .seed-layers').count(),1,id+' layers');
   const targets=await page.locator('[data-seed-field="target"] option').evaluateAll(options=>options.map(o=>o.value).filter(Boolean));
   if(targets.length){
    await page.selectOption('[data-seed-field="target"]',targets.at(-1));
    assert.match(await page.locator('.seed-reference').first().innerText(),/参考必要個数/);
    calculableIndividuals++;
   }
  }
  assert.equal(calculableIndividuals,7);
  assert.equal(await page.evaluate(()=>JSON.stringify([window.APP_DATA,window.SEED_INVESTMENT_DATA])),unchanged);
  assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),storage);
  for(const view of ['home','roster','refine','roles','plan']){
   await page.locator('.nav-item[data-view="'+view+'"]').click();
   assert.equal(await page.locator('.view.active').getAttribute('id'),view);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,view+' overflow');
  }
  await page.locator('.nav-item[data-view="roster"]').click();
  assert.equal(await page.locator('#rosterList .roster-card').count(),35);
  await page.locator('#rosterList [data-id="IND-0002"]').click();
  assert.match(await page.locator('#detailDialog').innerText(),/金種の投資判断/);
  assert.match(await page.locator('#detailDialog').innerText(),/未確定・使用承認なし/);
  await page.locator('#detailDialog').evaluate(el=>el.close());
  await page.locator('.nav-item[data-view="roles"]').click();
  assert.equal(await page.locator('.role-assignment').count(),33);
  assert.equal(await page.locator('.species-tier-row').count(),63);
  await page.locator('.nav-item[data-view="plan"]').click();
  await page.evaluate(()=>{window.SEED_INVESTMENT_DATA.meta.sourceRevision='stale';window.SeedInvestmentUI.renderPlan();});
  assert.match(await page.locator('#seedInvestmentPanel').innerText(),/版が一致しません/);
  assert.equal(await page.locator('#seedInvestmentPanel .seed-tier').count(),0);
  if(out)await page.screenshot({path:path.join(out,'seed-mobile-stale.png'),fullPage:true});
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const cached=await page.evaluate(async()=>{
   const names=await caches.keys(),name=names.find(n=>n==='pokemon-sleep-hub-v0.21-r37');
   if(!name)return [];
   const cache=await caches.open(name);return (await cache.keys()).map(r=>new URL(r.url).pathname.split('/').pop());
  });
  for(const file of ['seed-data.js','seed-model.js','seed-rules.js','seed-ui.js','seed-ui.css'])assert.ok(cached.includes(file),file+' offline cache');
  // Reproduce the old v0.20 update action: it erased this app's offline cache
  // before a fresh online navigation, even when the worker did not reinstall.
  await page.evaluate(async()=>{
   for(const key of await caches.keys())if(key.startsWith('pokemon-sleep-hub-'))await caches.delete(key);
  });
  await page.goto(base+'/?_refresh=legacy-update#plan',{waitUntil:'networkidle'});
  await page.waitForFunction(async()=>{
   const cache=await caches.open('pokemon-sleep-hub-v0.21-r37');
   return Boolean(await cache.match(new URL('./index.html',location.href).href));
  });
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.locator('#seedInvestmentPanel .seed-layers').waitFor();
  assert.equal(await page.locator('[data-seed-field="individual"] option').count(),35);
  await context.setOffline(false);
  await page.reload({waitUntil:'networkidle'});
  // The new update action must keep a working cache rather than erase it.
  await Promise.all([
   page.waitForURL(url=>url.searchParams.has('_refresh')&&url.searchParams.get('_refresh')!=='legacy-update'),
   page.evaluate(()=>applyLatestUpdate())
  ]);
  await page.waitForLoadState('networkidle');
  assert.equal(await page.evaluate(async()=>{
   const cache=await caches.open('pokemon-sleep-hub-v0.21-r37');
   return Boolean(await cache.match(new URL('./index.html',location.href).href));
  }),true,'update retained cached navigation');
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.locator('#seedInvestmentPanel .seed-layers').waitFor();
  assert.equal(await page.locator('[data-seed-field="individual"] option').count(),35);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'PASS',mobile:'390x844',themes:['light','dark'],roster:35,selectedIndividuals:individualIds.length,calculableIndividuals,roles:33,roleTiers:63,seedTiers:8,offline:true,legacyUpdateCacheRecovery:true,updateKeepsOffline:true,staleFailClosed:true,readOnly:true,browserErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
