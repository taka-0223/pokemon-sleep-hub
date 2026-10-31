"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const prefix="pokemon-sleep-hub-",currentCache=prefix+"v0.21-r37";
const base="https://example.test/pokemon-sleep-hub/";

function workerFixture(){
  const listeners={},stores=new Map(),log=[],controls={online:true,putFails:false,installFails:false};
  const key=request=>new URL(typeof request==="string"?request:request.url,base).href;
  const caches={
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());
      const store=stores.get(name);
      return {
        async addAll(paths){
          if(controls.installFails)throw Error("install failed");
          for(const p of paths)store.set(key(p),new Response("installed "+p));
          log.push("core-installed");
        },
        async put(request,response){if(controls.putFails)throw Error("quota");store.set(key(request),response);},
        async match(request){return store.get(key(request))?.clone();}
      };
    },
    async keys(){return [...stores.keys()];},
    async delete(name){log.push("delete "+name);return stores.delete(name);},
    async match(request){
      for(const store of stores.values())if(store.has(key(request)))return store.get(key(request)).clone();
      return undefined;
    }
  };
  const context={URL,Request,Response,caches,
    self:{registration:{scope:base},location:{origin:new URL(base).origin},
      addEventListener(type,fn){listeners[type]=fn;},
      async skipWaiting(){log.push("skip-waiting");},
      clients:{async claim(){log.push("claim");}}},
    async fetch(request,options){
      log.push({url:request.url,cache:options&&options.cache});
      if(!controls.online)throw Error("offline");
      return new Response("fresh html v0.21",{headers:{"content-type":"text/html"}});
    }
  };
  vm.runInNewContext(read("service-worker.js"),context);
  const lifecycle=async type=>{
    let wait;listeners[type]({waitUntil(promise){wait=promise;}});await wait;
  };
  const navigate=async suffix=>{
    let response;listeners.fetch({request:{method:"GET",url:new URL(suffix||"",base).href,mode:"navigate"},
      respondWith(promise){response=promise;}});return response;
  };
  return {stores,caches,controls,log,lifecycle,navigate};
}

test("worker installs the whole core before skipWaiting and preserves unrelated origin caches",async()=>{
  const env=workerFixture();
  await env.caches.open(prefix+"v0.20-r36");
  await env.caches.open("grand-bazaar-companion-v0.11.30");
  await env.lifecycle("install");
  assert.ok(env.log.indexOf("core-installed")<env.log.indexOf("skip-waiting"));
  await env.lifecycle("activate");
  assert.deepEqual((await env.caches.keys()).sort(),["grand-bazaar-companion-v0.11.30",currentCache].sort());
  assert.ok(env.log.indexOf("delete "+prefix+"v0.20-r36")<env.log.indexOf("claim"));
});

test("failed replacement installation leaves the previous offline cache and controller intact",async()=>{
  const env=workerFixture();await env.caches.open(prefix+"v0.20-r36");
  env.controls.installFails=true;
  await assert.rejects(env.lifecycle("install"),/install failed/);
  assert.ok((await env.caches.keys()).includes(prefix+"v0.20-r36"));
  assert.ok(!env.log.includes("skip-waiting")&&!env.log.includes("claim"));
});

test("legacy apply cache deletion followed by online reload rebuilds the offline HTML without reinstall",async()=>{
  const env=workerFixture();await env.lifecycle("install");await env.lifecycle("activate");
  for(const name of await env.caches.keys())if(name.startsWith(prefix))await env.caches.delete(name);
  assert.equal(await env.caches.match("./index.html"),undefined);
  assert.equal(await (await env.navigate("?_refresh=123")).text(),"fresh html v0.21");
  assert.equal(await (await env.caches.match("./index.html")).text(),"fresh html v0.21");
  assert.ok(env.log.some(entry=>entry&&entry.cache==="no-store"));
  env.controls.online=false;
  assert.equal(await (await env.navigate()).text(),"fresh html v0.21");
});

test("ordinary navigation also refreshes offline HTML and cache write failure cannot block an online load",async()=>{
  const env=workerFixture();await env.lifecycle("install");
  await env.navigate();
  assert.equal(await (await env.caches.match("./index.html")).text(),"fresh html v0.21");
  env.controls.putFails=true;
  assert.equal(await (await env.navigate()).text(),"fresh html v0.21");
});

test("navigating to another document cannot replace the offline app entry",async()=>{
  const env=workerFixture();await env.lifecycle("install");
  assert.equal(await (await env.navigate("README.md")).text(),"fresh html v0.21");
  assert.equal(await (await env.caches.match("./index.html")).text(),"installed ./index.html");
  await env.navigate("index.html?_reload=123");
  assert.equal(await (await env.caches.match("./index.html")).text(),"fresh html v0.21");
});

test("new apply preserves app and unrelated caches while updating and issuing a fresh navigation",async()=>{
  const env=workerFixture();await env.lifecycle("install");await env.caches.open("unrelated-app");
  const app=read("app.js"),start=app.indexOf("async function applyLatestUpdate(){"),end=app.indexOf("function reloadApp(){",start);
  assert.ok(start>=0&&end>start);
  let replacement=null,updateCalls=0;
  const context={URL,Date,caches:env.caches,window:{caches:env.caches},$:()=>({textContent:""}),
    navigator:{serviceWorker:{getRegistration:async()=>({update:async()=>{updateCalls++;}})}},
    location:{href:base+"#plan",replace(url){replacement=url;}}};
  vm.runInNewContext(app.slice(start,end),context);
  const before=await env.caches.keys();
  await vm.runInNewContext("applyLatestUpdate()",context);
  assert.equal(updateCalls,1);
  assert.deepEqual(await env.caches.keys(),before);
  assert.equal(new URL(replacement).hash,"#plan");
  assert.ok(new URL(replacement).searchParams.has("_refresh"));
  env.controls.online=false;
  assert.ok(await env.navigate());
});

async function registrationFixture(hadController){
  const html=read("index.html"),start=html.indexOf('if ("serviceWorker" in navigator) {'),end=html.indexOf("</script>",start);
  assert.ok(start>=0&&end>start);
  const log=[],listeners={},state={reloads:0};let load;
  const serviceWorker={controller:hadController?{}:null,
    addEventListener(type,fn){listeners[type]=fn;log.push("listener");},
    async register(){
      log.push("register");listeners.controllerchange?.();
      return {async update(){log.push("update");listeners.controllerchange?.();}};
    }};
  vm.runInNewContext(html.slice(start,end),{
    window:{addEventListener(type,fn){assert.equal(type,"load");load=fn;}},
    navigator:{serviceWorker},location:{reload(){state.reloads++;}},console:{warn(){}}
  });
  await load();return {log,state};
}

test("controllerchange listener precedes registration/update and reloads at most once for an existing controller",async()=>{
  const env=await registrationFixture(true);
  assert.deepEqual(env.log,["listener","register","update"]);
  assert.equal(env.state.reloads,1);
});

test("first installation claims control without a forced reload loop",async()=>{
  const env=await registrationFixture(false);
  assert.equal(env.state.reloads,0);
});
