import fs from 'node:fs';
import {chromium} from 'playwright';
const file=fs.readFileSync('../current-facts.js','utf8').trim();
if(!file.startsWith('window.APP_CURRENT_FACTS=')||!file.endsWith(';'))throw new Error('Missing public facts sidecar');
const facts=JSON.parse(file.slice('window.APP_CURRENT_FACTS='.length,-1));
if(facts.meta.sourceRevision!=='2026-10-21-r33')throw new Error('Source facts revision drift');
const holder=facts.individuals.find(x=>x.id==='IND-0023');
if(!holder||holder.targetSpeciesName!=='メタモン'||holder.foodPattern!=='AAB')throw new Error('Ditto fixed facts unexpected');
const subSkills=holder.subskills.map(x=>x.name);
const specs=[];
for(const level of [holder.level,30,60]){
 specs.push({id:`IND-0023-actual-${level}`,species:'メタモン',level,
   foodList:holder.foods,nature:holder.nature,subSkills,skillLv:holder.mainSkillLv,scenario:'real-individual-current-or-projected'});
}

const currentCompanions=['IND-0006','IND-0024','IND-0039','IND-0008','IND-0004'];
for(const id of currentCompanions){
 const person=facts.individuals.find(x=>x.id===id);
 if(!person)throw new Error('Missing public helper '+id);
 // The PWA display label may contain "Lv15③", which is not a simulator species name.
 const pokemonName=String(person.name).replace(/\\s+Lv\\d+.*$/,'').trim();
 specs.push({id:id+'-as-held',species:pokemonName,level:person.level,
   foodList:person.foods,skillLv:person.mainSkillLv,nature:person.nature,
   subSkills:person.subskills.map(x=>x.name),scenario:'other-current-team-holder'});
}

const configs=[
 ['メタモン','AAB',['ピュアなオイル','ピュアなオイル','ふといながねぎ']],
 ['ドクロッグ','AAA',['ピュアなオイル','ピュアなオイル','ピュアなオイル']],
 ['クチート','AAA',['ピュアなオイル','ピュアなオイル','ピュアなオイル']],
 ['クチート','ABC',['ピュアなオイル','ワカクサコーン','あんみんトマト']],
 ['ウッウ','AAA',['ピュアなオイル','ピュアなオイル','ピュアなオイル']],
 ['ウッウ','ABC',['ピュアなオイル','ほっこりポテト','とくせんエッグ']],
 ['レントラー','ABB',['あんみんトマト','ピュアなオイル','ピュアなオイル']],
 ['アブリボン','ABB',['あまいミツ','ピュアなオイル','ピュアなオイル']],
 ['カイリュー','ABC',['げきからハーブ','ワカクサコーン','ピュアなオイル']],
];
for(const level of [30,60])for(const [species,pattern,foodList] of configs){
 specs.push({id:`${species}-${pattern}-${level}`,species,level,foodList,skillLv:1,nature:'がんばりや',subSkills:[null,null,null,null,null],scenario:'neutral-no-subskills'});
}
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>console.error('PAGEERROR',e.message));
 await page.goto('http://127.0.0.1:5173/db01-oil.html',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.db01OilReady===true,{timeout:120000});
 const rows=[];
 for(const spec of specs){
  const row=await page.evaluate(spec=>window.runDb01OilCondition(spec),spec);
  rows.push(row);
  console.log(row.id,'direct-oil',row.direct['ピュアなオイル'],'combined-oil',row.combined['ピュアなオイル'],'skill/day',row.skillPerDay);
 }
 if(rows.length!==specs.length)throw new Error('Invalid case count');
 const output={schema:'db01-oil-fixed-engine-v1',generatedAt:new Date().toISOString(),
    simulatorCommit:'733701bbe6a625241c7701e76d830e0d8ff68c64',
    currentFactsRevision:facts.meta.sourceRevision,
    scope:'common config and two cohorts: real Ditto, neutral oil-focused species',
    inputs:specs,results:rows};
 fs.writeFileSync('../db01-oil-comparable-results.json',JSON.stringify(output,null,2));
}finally{await browser.close();}