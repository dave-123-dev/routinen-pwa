import './app-v33.js';

const KEY='habit_tasks_v5';
const UI_KEY='routinen_ui_v33';
let pendingReplayTitle='';
const readTasks=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function sortedHistory(){
  const out=[];
  readTasks().forEach(task=>{
    (Array.isArray(task.history)?task.history:[]).forEach(iso=>out.push({iso,task}));
    if(task.completedAt&&!out.some(x=>x.iso===task.completedAt&&String(x.task.id)===String(task.id)))out.push({iso:task.completedAt,task});
  });
  return out.sort((a,b)=>new Date(b.iso)-new Date(a.iso));
}
function addStyles(){
  if(document.getElementById('v34-style'))return;
  const s=document.createElement('style');
  s.id='v34-style';
  s.textContent=`
    #list .section.done,#list .card.done{display:none!important}
    body.compact #list .card{position:relative;padding-right:62px!important}
    body.compact #list .card .edit{display:flex!important;position:absolute;right:18px;top:16px;width:34px;height:34px;border:1px solid var(--line);border-radius:50%;align-items:center;justify-content:center;background:transparent;color:var(--muted);font-size:18px;padding:0}
    .miniDone{display:none}
    body.compact .miniDone{display:flex;position:absolute;right:21px;top:54px;width:28px;height:28px;border:0;background:transparent;color:#111;align-items:center;justify-content:center;font-size:15px;line-height:1;padding:0;font-weight:500}
    @media (prefers-color-scheme:dark){body.compact .miniDone{color:#f6f2ea}}
    .pastItem{position:relative;padding-right:58px!important}.pastReload{display:none}
    body.compact .pastReload{display:flex;position:absolute;right:16px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:1px solid var(--line);border-radius:50%;background:transparent;color:var(--accent);align-items:center;justify-content:center;font-size:20px;padding:0}
  `;
  document.head.appendChild(s);
}
function ensureMiniDone(){
  document.querySelectorAll('#list .card[data-id]').forEach(card=>{
    if(card.classList.contains('done'))return;
    if(card.querySelector('.miniDone'))return;
    const b=document.createElement('button');
    b.type='button';
    b.className='miniDone';
    b.setAttribute('aria-label','Als erledigt markieren');
    b.textContent='✓';
    b.dataset.miniDone=card.dataset.id;
    card.appendChild(b);
  });
}
function enhancePast(){
  const items=sortedHistory();
  document.querySelectorAll('#pastList .pastItem').forEach((el,i)=>{
    const entry=items[i];
    if(!entry)return;
    el.dataset.replayIndex=String(i);
    if(!el.querySelector('.pastReload')){
      const b=document.createElement('button');
      b.type='button';
      b.className='pastReload';
      b.textContent='↻';
      b.setAttribute('aria-label','Als neue Aufgabe übernehmen');
      b.dataset.replayIndex=String(i);
      el.appendChild(b);
    }
  });
}
function cleanCurrentDone(){
  document.querySelectorAll('#list .card.done,#list .section.done').forEach(el=>el.remove());
}
function schedule(){setTimeout(apply,0);setTimeout(apply,180)}
function apply(){addStyles();cleanCurrentDone();ensureMiniDone();enhancePast()}
function clickTab(name){const b=document.querySelector(`[data-tab="${name}"]`);if(b)b.click()}
function openNewFromTask(task){
  const fab=document.getElementById('fab');
  if(fab)fab.click();
  setTimeout(()=>{
    const rule=task.ruleType||'date';
    const tabId=rule==='weekday'?'weekTab':rule==='interval'?'intervalTab':'dateTab';
    const tab=document.getElementById(tabId);if(tab)tab.click();
    const set=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val||''};
    set('emoji',task.emoji||'');set('title',task.title||'');set('details',task.details||'');set('reminder',task.reminderTime||'');
    set('target',task.targetDate||'');set('targetTime',task.targetTime||'');
    const allow=document.getElementById('allowMulti');if(allow)allow.checked=!!task.allowMultiplePerDay;
    set('intervalAmount',task.intervalAmount||1);set('intervalUnit',task.intervalUnit||'hours');set('intervalStartDate',task.intervalStartDate||'');set('intervalStartTime',task.intervalStartTime||'');
    if(rule==='weekday'&&Array.isArray(task.weekdays)){
      document.querySelectorAll('#days [data-day]').forEach(btn=>{
        const should=task.weekdays.map(Number).includes(Number(btn.dataset.day));
        const on=btn.classList.contains('on');
        if(should!==on)btn.click();
      });
    }
    pendingReplayTitle=task.title||'';
  },80);
}
document.addEventListener('click',event=>{
  const mini=event.target.closest('[data-mini-done]');
  if(mini){event.preventDefault();event.stopPropagation();const card=mini.closest('.card');const done=card?.querySelector('[data-check]');if(done)done.click();schedule();return}
  const replay=event.target.closest('.pastReload');
  if(replay){event.preventDefault();event.stopPropagation();const entry=sortedHistory()[Number(replay.dataset.replayIndex)];if(entry)openNewFromTask(entry.task);return}
  if(event.target.closest('#saveBtn')&&pendingReplayTitle){
    const title=pendingReplayTitle;
    pendingReplayTitle='';
    setTimeout(()=>{localStorage.setItem(UI_KEY,JSON.stringify({tab:'current',compact:document.body.classList.contains('compact')}));clickTab('current');schedule();setTimeout(()=>{const card=[...document.querySelectorAll('#list .card')].find(c=>(c.querySelector('.taskTitle')?.textContent||'').trim()===title);if(card)card.scrollIntoView({block:'center',behavior:'smooth'});},250)},350);
  }
},true);
document.addEventListener('change',schedule,true);
window.addEventListener('focus',schedule);
schedule();
