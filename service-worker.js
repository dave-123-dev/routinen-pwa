const CACHE='routinen-cache-v7';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon.svg','./import-fix.js'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function withImportFix(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  let html=await response.text();
  if(!html.includes('import-fix.js')){
    html=html.replace('</body>','<script src="./import-fix.js?v=7"></script></body>');
  }
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
}

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  const isPage=e.request.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  if(isPage){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(withImportFix)
        .catch(()=>caches.match('./index.html').then(r=>r?withImportFix(r):caches.match(e.request)))
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});

self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});