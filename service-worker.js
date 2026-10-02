const CACHE_NAME="pokemon-sleep-hub-v0.3.1";
const CORE=["./","./index.html","./style.css","./app.js","./data.js","./srp.js","./manifest.webmanifest","./site/icons/icon-192.png","./site/icons/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html"))))});
