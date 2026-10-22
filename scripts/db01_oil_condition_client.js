import config from '/src/models/config.ts';
import Pokemon from '/src/data/pokemon.ts';
import PokemonSimulator from '/src/models/simulation/pokemon-simulator.ts';
import { Food } from '/src/data/food_and_cooking.ts';

/*
 * Fixed 2026-09-29 simulator engine, no individual PR percentile tables.
 * This is a direct numerical estimate of ingredient production under *one*
 * standardized config, not a formal Species Tier or role decision.
 */
const FIELDS=Food.list.map(x=>x.name); // all 19 foods, no restricted set
const blankSkills=[null,null,null,null,null];
function cleanNum(x) {
 if(typeof x!=='number'||!Number.isFinite(x))throw new Error('Invalid simulator numeric result: '+x);
 return Math.round(x*10000)/10000;
}
window.runDb01OilCondition=(spec)=>{
 const cfg=config.clone();
 cfg.sleepTime=8.5;
 cfg.checkFreq=10;
 cfg.simulation.field='ワカクサ本島';
 cfg.simulation.fieldBonus=0;
 cfg.simulation.eventBonusList=[];
 cfg.simulation.campTicket=false;
 cfg.simulation.berryList=['','',''];
 cfg.simulation.fix=false;
 cfg.simulation.fixSubSkillSeed=false;
 cfg.simulation.fixSkillSeed=false;
 cfg.simulation.genkiFull=false;
 cfg.simulation.researchRankMax=false;
 cfg.simulation.bagOverOperation=true;
 cfg.simulation.foodEnergyWeight=1;
 cfg.simulation.skillEnergyIgnore=false;
 cfg.simulation.cookingRecipeLv=1;
 cfg.simulation.potSize=101;
 cfg.simulation.expectType.food=0; // expectation, no percentile-quantile lower bound
 cfg.simulation.expectType.border=70;
 cfg.teamSimulation.foodGetEvaluateRate=1; // whole ingredient skill output, not 30% discounted
 const base=Pokemon.map[spec.species];
 if(!base)throw new Error('Unknown species '+spec.species);
 const foods=spec.foodList;
 for(const name of foods)if(!base.foodNameList.includes(name))throw new Error('Unavailable ingredient '+name+' for '+spec.species);
 const box={name:spec.species,lv:spec.level,skillLv:spec.skillLv??1,
  foodList:foods,subSkillList:spec.subSkills||blankSkills,nature:spec.nature||'がんばりや',
  shiny:false,fix:null,index:0,sleepTime:0};
 const sim=new PokemonSimulator(cfg,PokemonSimulator.MODE_ABOUT);
 const pokemon=sim.fromBox(box,false,0,0);
 sim.calcStatus(pokemon,0,0);
 sim.calcTeamHeal([pokemon]);
 sim.calcHelp(pokemon,{boxPokemonList:[box]});
 const totalIngredientTrials=pokemon.normalHelpNum*pokemon.foodRate;
 const direct={};
 for(const row of pokemon.foodList) direct[row.name]=(direct[row.name]||0)+row.num*totalIngredientTrials/pokemon.foodList.length;
 const combined={};
 const skillAdded={};
 for(const name of FIELDS){
   const v=pokemon[name]||0, d=direct[name]||0;
   if(v< -1e-7)throw new Error('Negative '+name);
   combined[name]=cleanNum(v);
   direct[name]=cleanNum(d);
   skillAdded[name]=cleanNum(v-d);
 }
 const result={
    id:spec.id, species:spec.species, scenario:spec.scenario, level:spec.level,
    foodList:spec.foodList, nature:box.nature, subSkills:box.subSkillList,
    skillLv:box.skillLv, simulatorCommit:'733701bbe6a625241c7701e76d830e0d8ff68c64',
    model:'MODE_ABOUT; normal 8.5h sleep; 10 checks/day; no team heal, events, camp or berry bonus',
    baseHelpSeconds:base.help,baseFoodRate:base.foodRate,baseSkillRate:base.skillRate,
    normalHelpNum:cleanNum(pokemon.normalHelpNum),foodRate:cleanNum(pokemon.foodRate),
    skillPerDay:cleanNum(pokemon.skillPerDay),
    direct,combined,skillAdded,
    skillName:base.skill.name,skillEnergy:cleanNum(pokemon.skillEnergyPerDay),
    cookingChanceEffect:cleanNum(pokemon.cookingChanceEffect||0),
    warning:'Skill-added food is model-conditional and must not be double-counted with ingredient ranking'
 };
 for(const section of [result.direct,result.combined,result.skillAdded])for(const n of Object.values(section))if(!Number.isFinite(n))throw new Error('non-finite');
 return result;
};
window.db01OilReady=true;