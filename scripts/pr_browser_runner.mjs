import fs from 'node:fs';
import { chromium } from 'playwright';

const inputPath=process.argv[2] ?? 'pr-calc-input.json';
const outputPath=process.argv[3] ?? 'pr-results.json';
const input=JSON.parse(fs.readFileSync(inputPath,'utf8'));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
page.on('console',msg=>console.log('[browser]',msg.type(),msg.text()));
page.on('pageerror',err=>console.error('[pageerror]',err));
await page.goto('http://127.0.0.1:5173/pr-automation.html',{waitUntil:'networkidle',timeout:120000});
await page.waitForFunction(()=>window.prAutomationReady===true,{timeout:120000});

const results=[];
for(const spec of input.cases){
  console.log('Evaluating',spec.id,spec.name,'->',spec.targetName);
  const result=await page.evaluate(async spec=>await window.runEvaluate(spec),spec);
  results.push(result);
  console.log(JSON.stringify(result));
}
await browser.close();
fs.writeFileSync(outputPath,JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));
console.log('Wrote',outputPath);
