const CACHE_NAME="pokemon-sleep-hub-v0.23";
const CORE=["./","./index.html","./style.css","./app.js","./data.js","./srp.js","./updates.js","./manifest.webmanifest","./icons/app-icon.svg"];
const CORE_PATHS=new Set(CORE.map(p=>new URL(p,self.registration.scope).pathname));

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(url.searchParams.has("update-check")){
    e.respondWith(fetch(req,{cache:"no-store"}));
    return;
  }

  if(req.mode==="navigate"){
    const forceFresh=url.searchParams.has("_refresh")||url.searchParams.has("_reload");
    e.respondWith(fetch(req,forceFresh?{cache:"no-store"}:undefined).catch(()=>caches.match("./index.html")));
    return;
  }

  if(!CORE_PATHS.has(url.pathname))return;

  const canonical=new Request(url.origin+url.pathname);
  e.respondWith(
    fetch(req).then(r=>{
      if(r.ok){
        const copy=r.clone();
        caches.open(CACHE_NAME).then(c=>c.put(canonical,copy));
      }
      return r;
    }).catch(()=>caches.match(canonical))
  );
});
