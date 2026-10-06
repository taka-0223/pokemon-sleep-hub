import Pokemon from '/src/data/pokemon.ts';
import config from '/src/models/config.ts';
import MultiWorker from '/src/models/multi-worker.js';
import EvaluateTable from '/src/models/simulation/evaluate-table.ts';
import PokemonListSimulator from '/src/models/pokemon-box/pokemon-box-worker?worker';
import ProgressCounter from '/src/models/progress-counter.js';

const lvList=[30,50,60,70,80];
const levelFlags={10:false,25:false,30:true,50:true,60:true,70:true,80:true};

window.runEvaluate=async function(spec){
  const pokemon={
    name:spec.name,
    lv:spec.lv ?? 1,
    skillLv:spec.skillLv ?? 1,
    foodList:spec.foodList,
    subSkillList:spec.subSkillList,
    nature:spec.nature,
    shiny:false,
    fix:null,
    index:-1,
  };
  const base=Pokemon.map[pokemon.name];
  if(!base) throw new Error('Unknown pokemon: '+pokemon.name);

  const evaluateConfig=config.clone();
  evaluateConfig.tmpEvaluate.levelList=levelFlags;
  evaluateConfig.tmpEvaluate.workerNum=1;
  evaluateConfig.workerNum=1;
  const table=await EvaluateTable.simulateTemporary(
    evaluateConfig,
    pokemon.name,
    new ProgressCounter(),
  );
  evaluateConfig.selectEvaluate=evaluateConfig.tmpEvaluate;
  evaluateConfig.sleepTime=evaluateConfig.tmpEvaluate.sleepTime;
  evaluateConfig.checkFreq=evaluateConfig.tmpEvaluate.checkFreq;
  evaluateConfig.workerNum=1;
  evaluateConfig.pureMint=false;

  const worker=new MultiWorker(PokemonListSimulator,1);
  try{
    await worker.call(new ProgressCounter(),()=>({type:'config',config:evaluateConfig}));
    const [[simulated]]=await worker.call(new ProgressCounter(),()=>({
      type:'basic',
      pokemonList:[JSON.parse(JSON.stringify(pokemon))],
      evaluateTable:table,
    }));
    const target=spec.targetName;
    const result={id:spec.id,name:spec.name,targetName:target,levels:{}};
    for(const lv of lvList){
      const e=simulated?.evaluateResult?.[lv]?.[target];
      if(!e) continue;
      result.levels[lv]={
        energyPR:Number(((e.energy?.rate ?? 0)*100).toFixed(1)),
        berryPR:Number(((e.berry?.rate ?? 0)*100).toFixed(1)),
        foodPR:Number(((e.food?.rate ?? 0)*100).toFixed(1)),
        skillPR:Number(((e.skill?.rate ?? 0)*100).toFixed(1)),
        specialtyPR:Number(((e.specialty?.rate ?? 0)*100).toFixed(1)),
        diagnostics:e.diagnostic ?? null,
      };
    }
    return result;
  } finally {
    worker.close();
  }
};
window.prAutomationReady=true;
