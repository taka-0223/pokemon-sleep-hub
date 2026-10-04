const { chromium } = require('playwright');
const fs = require('fs');

const TARGETS = [
  {id:'IND-0020', name:'アブリボン', foods:['あまいミツ','あまいミツ','ワカクサコーン'], nature:'やんちゃ', subs:['スキル確率アップM','食材確率アップM','ゆめのかけらボーナス','スキル確率アップS','食材確率アップS'], metric:'food'},
  {id:'IND-0021', name:'アブリボン', foods:['あまいミツ','ピュアなオイル','あまいミツ'], nature:'すなお', subs:['スキルレベルアップS','食材確率アップM','スキル確率アップM','最大所持数アップL','食材確率アップS'], metric:'food'},
  {id:'IND-0022', name:'パンプジン(ギガだましゅ)', foods:['ずっしりカボチャ','ずっしりカボチャ','ほっこりポテト'], nature:'すなお', subs:['食材確率アップM','おてつだいスピードM','最大所持数アップM','食材確率アップS','スキル確率アップS'], metric:'food'},
  {id:'IND-0023', name:'メタモン', foods:['ピュアなオイル','ピュアなオイル','ふといながねぎ'], nature:'おっとり', subs:['スキル確率アップM','ゆめのかけらボーナス','おてつだいスピードS','スキルレベルアップS','リサーチEXPボーナス'], metric:'food'},
  {id:'IND-0024', name:'キュワワー', foods:['ワカクサコーン','ワカクサコーン','リラックスカカオ'], nature:'いじっぱり', subs:['スキルレベルアップS','最大所持数アップS','睡眠EXPボーナス','おてつだいスピードS','おてつだいスピードM'], metric:'food'},
  {id:'IND-0025', name:'ゲンガー', foods:['げきからハーブ','あじわいキノコ','あじわいキノコ'], nature:'まじめ', subs:['スキル確率アップS','げんき回復ボーナス','おてつだいスピードM','おてつだいスピードS','最大所持数アップS'], metric:'food'},
  {id:'IND-0026', name:'ドードリオ', foods:['ワカクサ大豆','ワカクサ大豆','ワカクサ大豆'], nature:'やんちゃ', subs:['食材確率アップM','おてつだいスピードS','おてつだいスピードM','ゆめのかけらボーナス','最大所持数アップM'], metric:'berry'},
  {id:'IND-0027', name:'バクフーン', foods:['あったかジンジャー','げきからハーブ','あったかジンジャー'], nature:'のうてんき', subs:['食材確率アップM','おてつだいボーナス','最大所持数アップM','おてつだいスピードS','食材確率アップS'], metric:'berry'},
  {id:'IND-0028', name:'エンペルト', foods:['とくせんエッグ','ふといながねぎ','ふといながねぎ'], nature:'おとなしい', subs:['きのみの数S','スキル確率アップS','最大所持数アップS','おてつだいスピードM','食材確率アップS'], metric:'berry'},
];

const SHORT = {
  'きのみの数S':'きのみS','げんき回復ボーナス':'げんボ','ゆめのかけらボーナス':'ゆめボ',
  'リサーチEXPボーナス':'リサボ','睡眠EXPボーナス':'睡眠ボ','おてつだいボーナス':'おてボ',
  'スキルレベルアップM':'スキLvM','スキル確率アップM':'スキ確M','食材確率アップM':'食確M',
  'スキルレベルアップS':'スキLvS','おてつだいスピードM':'おてｽﾋﾟM','最大所持数アップL':'所持L',
  '最大所持数アップM':'所持M','スキル確率アップS':'スキ確S','食材確率アップS':'食確S',
  'おてつだいスピードS':'おてｽﾋﾟS','最大所持数アップS':'所持S'
};

async function setPokemon(page, t) {
  const selectedName = (await page.locator('.form').innerText()).split('\n').find(x => x && !['ポケモン','食材','サブスキル','せいかく'].includes(x) && !x.includes('スクショ') && !x.includes('※')) || 'フシギダネ';
  const currentPokemonButton = page.getByRole('button',{name:selectedName,exact:true}).first();
  console.log('CURRENT_BUTTON', await currentPokemonButton.innerText());
  await currentPokemonButton.click();
  await page.getByText('ポケモンを選択',{exact:true}).waitFor();
  const row = page.locator('tbody tr').filter({hasText:t.name}).first();
  await row.waitFor();
  await row.click();
  await page.getByRole('button',{name:t.name,exact:true}).first().waitFor();

  const foodGroups = page.locator('.food-icon-select');
  for (let i=0;i<3;i++) {
    const img = foodGroups.nth(i).locator(`img[alt="${t.foods[i]}"]`).first();
    await img.waitFor();
    await img.locator('..').click();
  }

  const selected = page.locator('.selected-list .selected-item');
  const candidates = page.locator('.candidate-list .sub-skill-label');
  for (let i=0;i<5;i++) {
    await selected.nth(i).click();
    const label = SHORT[t.subs[i]];
    await candidates.filter({hasText:label}).first().click();
  }

  await page.getByRole('button',{name:t.nature,exact:true}).click();
}

async function extractResult(page,t) {
  const section = page.locator('.evolution-chart').filter({has:page.locator('h3',{hasText:t.name})}).first();
  await section.waitFor({timeout:300000});
  const table = section.locator('.evaluate-rate-table').first();
  const rows = await table.locator('tbody tr').allTextContents();
  const cells = await table.locator('tbody tr').evaluateAll(rows => rows.map(r => [...r.querySelectorAll('td')].map(td => td.textContent.trim())));
  const keyIndex = {energy:0,berry:1,food:2,skill:3}[t.metric];
  const parse = s => Number(String(s).replace('%','').trim());
  const energyRow=cells[0], roleRow=cells[keyIndex];
  return {
    id:t.id, name:t.name, metric:t.metric,
    energy:{lv30:parse(energyRow[1]),lv50:parse(energyRow[2]),lv60:parse(energyRow[3])},
    role:{lv30:parse(roleRow[1]),lv50:parse(roleRow[2]),lv60:parse(roleRow[3])},
    allRows:cells
  };
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1200}});
  page.setDefaultTimeout(30000);

  await page.goto('https://reimer0204.github.io/pokesle-simulator/#/tmp-evaluate',{waitUntil:'networkidle',timeout:120000});
  await page.waitForTimeout(2500);
  await page.evaluate(()=>{
    const cfg=JSON.parse(localStorage.getItem('config')||'{}');
    if (cfg.tmpEvaluate?.silverSeed) {
      for (const k of Object.keys(cfg.tmpEvaluate.silverSeed)) cfg.tmpEvaluate.silverSeed[k]=false;
    }
    if (cfg.tmpEvaluate) {
      cfg.tmpEvaluate.levelList={10:false,25:false,30:true,50:true,60:true,70:false,80:false};
      cfg.tmpEvaluate.workerNum=1;
    }
    cfg.pokemonEdit=cfg.pokemonEdit||{};
    cfg.pokemonEdit.selectDisplayMode='table';
    localStorage.setItem('config',JSON.stringify(cfg));
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(5000);
  console.log('PAGE_URL',page.url());
  console.log('PAGE_TITLE',await page.title());
  console.log('BODY', (await page.locator('body').innerText()).slice(0,5000));
  console.log('FORM_BUTTONS',await page.locator('.form button').allTextContents());

  const results=[];
  for (const t of TARGETS) {
    console.log('MEASURE',t.id,t.name);
    await setPokemon(page,t);
    await page.getByRole('button',{name:'評価',exact:true}).click();
    const res=await extractResult(page,t);
    console.log(JSON.stringify(res));
    results.push(res);
  }
  fs.writeFileSync('pr-results.json',JSON.stringify({measuredAt:new Date().toISOString(),source:'pokesle-simulator tmp-evaluate',silverSeed:false,results},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});