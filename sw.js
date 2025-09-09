// sw.js
const CACHE = 'oxo-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirstWithRange(req));
  }
});

async function cacheFirstWithRange(req){
  const cache = await caches.open(CACHE);
  const range = req.headers.get('range');
  const urlNoRange = new Request(req.url, {method:'GET'});

  let res = await cache.match(urlNoRange);
  if (!res) {
    const net = await fetch(req);
    if (net && net.ok) cache.put(urlNoRange, net.clone());
    return net;
  }
  if (!range) return res.clone();

  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d+)-(\d+)?/.exec(range);
  if (!m) return new Response(null,{status:416});
  const start = Number(m[1]);
  const end = m[2]?Number(m[2]):(size-1);
  if (start>=size) {
    return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  }
  const chunk = buf.slice(start,end+1);
  return new Response(chunk,{
    status:206,
    headers:{
      'Content-Type': res.headers.get('Content-Type')||'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges':'bytes',
      'Content-Length': String(chunk.byteLength)
    }
  });
}
