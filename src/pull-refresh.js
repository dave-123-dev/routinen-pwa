import { APP_VERSION } from './version.js';
export function initPullRefresh(){
  const threshold=78;let startY=0,pulling=false,distance=0;
  const text={de:{pull:'Zum Aktualisieren ziehen',release:'Loslassen zum Aktualisieren',loading:'Aktualisiere…'},en:{pull:'Pull to refresh',release:'Release to refresh',loading:'Refreshing…'}};
  const lang=()=>((localStorage.getItem('habit_language_v1')||document.documentElement.lang||'de').slice(0,2)==='en'?'en':'de');
  function ui(){let el=document.getElementById('pullRefresh');if(el)return el;let style=document.createElement('style');style.textContent='#pullRefresh{position:fixed;left:50%;top:10px;transform:translate(-50%,-72px);z-index:1000;background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:999px;padding:10px 16px;font-size:13px;font-weight:850;box-shadow:var(--shadow);transition:transform .18s ease,opacity .18s ease;opacity:0;pointer-events:none;white-space:nowrap}#pullRefresh.show{opacity:1}';document.head.appendChild(style);el=document.createElement('div');el.id='pullRefresh';document.body.appendChild(el);return el}
  function setVersion(){let v=document.getElementById('version');if(v)v.textContent=APP_VERSION}
  async function refresh(el){el.textContent=text[lang()].loading;el.style.transform='translate(-50%,12px)';try{let reg=await navigator.serviceWorker?.getRegistration();await reg?.update()}catch{}setTimeout(()=>location.reload(),260)}
  document.addEventListener('touchstart',e=>{if(scrollY>0||!e.touches||e.touches.length!==1)return;startY=e.touches[0].clientY;pulling=true;distance=0},{passive:true});
  document.addEventListener('touchmove',e=>{if(!pulling||scrollY>0)return;distance=e.touches[0].clientY-startY;if(distance<=0)return;let el=ui(),y=Math.min(distance*.45,84);el.classList.add('show');el.textContent=distance>threshold?text[lang()].release:text[lang()].pull;el.style.transform=`translate(-50%,${y-54}px)`;if(distance>12)e.preventDefault()},{passive:false});
  function end(){if(!pulling)return;let el=ui();pulling=false;if(distance>threshold)return refresh(el);el.style.transform='translate(-50%,-72px)';el.classList.remove('show');distance=0}
  document.addEventListener('touchend',end,{passive:true});document.addEventListener('touchcancel',end,{passive:true});setVersion();ui();
}
