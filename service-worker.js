const CACHE='routinen-cache-v30';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon.svg','./styles/app.css?v=30','./styles/v27-task-buttons.css?v=30','./src/version.js','./src/emoji-map.js','./src/emoji.js','./src/pull-refresh.js','./src/app-v29.js?v=30','./src/app-v30.js?v=30'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode==='navigate'){e.respondWith(fetch(r,{cache:'no-store'}).then(x=>{const y=x.clone();caches.open(CACHE).then(c=>c.put('./index.html',y));return x}).catch(()=>caches.match('./index.html')));return}e.respondWith(caches.match(r).then(c=>c||fetch(r).then(x=>{const y=x.clone();caches.open(CACHE).then(ca=>ca.put(r,y));return x})))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
