(() => {
  function $(id) { return document.getElementById(id); }
  const KEY = 'habit_tasks_v5';
  const D = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const today = () => new Date().toLocaleDateString('sv');
  const td = s => new Date(s + 'T00:00:00');
  const add = (s,n) => { const d = td(s || today()); d.setDate(d.getDate()+n); return d.toLocaleDateString('sv'); };
  const wd = s => (td(s).getDay()+6)%7;
  const weekEnd = () => { const d = td(today()); const x = (d.getDay()+6)%7; d.setDate(d.getDate()+6-x); return d.toLocaleDateString('sv'); };
  const nextWeekEnd = () => add(weekEnd(),7);
  const fmt = s => s ? td(s).toLocaleDateString('de-CH',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}) : 'Ohne Datum';
  const esc = s => String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  let histStartX = 0, histStartY = 0, histRow = null, currentHistId = null;

  function getTasks(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function saveTasks(tasks){ localStorage.setItem(KEY, JSON.stringify(tasks)); }
  function done(t){ return t.ruleType === 'date' && !!t.completed; }
  function stat(t){
    if(done(t)) return {key:'done',label:'Erledigt',rank:9};
    const d=t.targetDate;
    if(!d) return {key:'open',label:'Ohne Datum',rank:6};
    if(d<=today()) return {key:'today',label:'Heute fällig',rank:0};
    if(d===add(today(),1)) return {key:'tomorrow',label:'Morgen',rank:1};
    if(d<=weekEnd()) return {key:'week',label:'Diese Woche',rank:2};
    if(d<=nextWeekEnd()) return {key:'nextweek',label:'Nächste Woche',rank:3};
    return {key:'later',label:'Später',rank:4};
  }
  function meta(t){
    const r=t.reminderTime?' · Erinnerung '+t.reminderTime:'';
    return t.ruleType==='weekday' ? 'Wochentage '+(t.weekdays||[]).map(i=>D[i]).join(', ')+' · Ziel '+fmt(t.targetDate)+r : fmt(t.targetDate)+r;
  }
  function toast(msg){
    const t=$('toast');
    if(!t) return;
    t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200);
  }
  function renderCard(t){
    const s=stat(t);
    const editIcon=done(t)?'↻':'✎';
    return '<div class="card '+s.key+'" data-id="'+t.id+'"><button class="delSwipe" data-del="'+t.id+'">Löschen</button><button class="check" data-check="'+t.id+'">'+(done(t)?'✓':'○')+'</button><div><div class="name">'+(t.emoji?'<span class="emoji">'+esc(t.emoji)+'</span>':'')+'<span>'+esc(t.title)+'</span></div><div class="meta">'+meta(t)+((t.lastDone||t.completedAt)?' · zuletzt '+fmt((t.lastDone||t.completedAt).slice(0,10)):'')+'</div></div><div class="side"><span class="status">'+s.label+'</span><button class="edit" data-edit="'+t.id+'">'+editIcon+'</button></div></div>';
  }
  function renderMain(){
    const list=$('list'), badge=$('badge');
    if(!list) return;
    const tasks=getTasks();
    const sorted=[...tasks].sort((a,b)=>stat(a).rank-stat(b).rank||String(a.targetDate||'9999').localeCompare(String(b.targetDate||'9999')));
    const groups=[['today','Heute fällig'],['tomorrow','Morgen'],['week','Diese Woche'],['nextweek','Nächste Woche'],['later','Später'],['open','Ohne Datum']];
    const due=sorted.filter(t=>stat(t).key==='today').length;
    if(badge){ badge.style.display=due?'block':'none'; badge.textContent=due+' heute'; }
    if(!tasks.length){ list.innerHTML='<div class="empty">Noch keine Aufgaben.<br>Tippe + um zu beginnen.</div>'; return; }
    let html='';
    groups.forEach(g=>{const a=sorted.filter(t=>stat(t).key===g[0]); if(a.length) html+='<div class="section">'+g[1]+'</div>'+a.map(renderCard).join('');});
    const d=sorted.filter(t=>stat(t).key==='done');
    if(d.length) html+='<div class="section done">Erledigt</div>'+d.map(renderCard).join('');
    list.innerHTML=html;
  }
  function deleteHistoryEntry(id, iso){
    const tasks=getTasks().map(t=>{
      if(String(t.id)!==String(id)) return t;
      const history=(t.history||[]).filter(x=>x!==iso);
      const last=history.length?[...history].sort().at(-1):null;
      const patch={...t,history,lastDone:t.ruleType==='weekday'?last:t.lastDone};
      if(t.ruleType==='date' && t.completedAt===iso){ patch.completed=false; patch.completedAt=null; }
      return patch;
    });
    saveTasks(tasks);
    renderMain();
    if(currentHistId) openHist(currentHistId); else renderAllHist();
    toast('Verlauf gelöscht');
  }
  function histItem(taskId, iso){
    const d=new Date(iso);
    return '<div class="hist histSwipe" data-hrow="1"><button class="histSwipeDel" data-hdel="'+taskId+'" data-hiso="'+encodeURIComponent(iso)+'">Löschen</button><span>'+d.toLocaleDateString('de-CH',{weekday:'long',day:'2-digit',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})+'</span></div>';
  }
  function openHist(id){
    const tasks=getTasks();
    const t=tasks.find(x=>String(x.id)===String(id));
    if(!t) return;
    currentHistId=t.id;
    $('history')?.classList.add('show');
    if($('histTitle')) $('histTitle').textContent=(t.emoji?t.emoji+' ':'')+t.title;
    const h=[...(t.history||[])].reverse();
    if($('histBody')) $('histBody').innerHTML='<div class="meta">'+meta(t)+'</div>'+(h.length?h.map(x=>histItem(t.id,x)).join(''):'<div class="empty">Noch kein Verlauf</div>');
  }
  function renderAllHist(){
    currentHistId=null;
    $('history')?.classList.add('show');
    if($('histTitle')) $('histTitle').textContent='Verlauf';
    const tasks=getTasks();
    if($('histBody')) $('histBody').innerHTML=tasks.map(t=>'<h3>'+esc((t.emoji?t.emoji+' ':'')+t.title)+'</h3>'+((t.history||[]).slice().reverse().map(x=>histItem(t.id,x)).join('')||'<div class="meta">Noch kein Verlauf</div>')).join('');
  }
  function installHistorySwipe(){
    const body=$('histBody');
    if(!body || body.dataset.swipeFix) return;
    body.dataset.swipeFix='1';
    body.addEventListener('touchstart',e=>{histRow=e.target.closest('.histSwipe'); if(!histRow) return; histStartX=e.touches[0].clientX; histStartY=e.touches[0].clientY;},{passive:true});
    body.addEventListener('touchend',e=>{if(!histRow) return; const dx=e.changedTouches[0].clientX-histStartX, dy=e.changedTouches[0].clientY-histStartY; if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4){ document.querySelectorAll('.histSwipe.swiped').forEach(x=>x!==histRow&&x.classList.remove('swiped')); dx<0?histRow.classList.add('swiped'):histRow.classList.remove('swiped'); } histRow=null;},{passive:true});
    body.addEventListener('click',e=>{const b=e.target.closest('[data-hdel]'); if(!b) return; deleteHistoryEntry(b.dataset.hdel, decodeURIComponent(b.dataset.hiso));});
  }
  function installCss(){
    if(document.getElementById('historySwipeFixCss')) return;
    const style=document.createElement('style');
    style.id='historySwipeFixCss';
    style.textContent='.histSwipe{position:relative;overflow:visible;transition:transform .22s ease}.histSwipe.swiped{transform:translateX(-96px)}.histSwipeDel{position:absolute;right:-88px;top:6px;bottom:6px;width:76px;border:0;border-radius:12px;background:var(--red);color:#fff;font-weight:900}.histDel{display:none!important}.done .edit{color:var(--green);font-weight:900}';
    document.head.appendChild(style);
  }
  function patchSaveForFutureDone(){
    const save=$('save');
    if(!save || save.dataset.futureFix) return;
    save.dataset.futureFix='1';
    save.addEventListener('click',()=>{
      setTimeout(()=>{
        const tasks=getTasks();
        let changed=false;
        const fixed=tasks.map(t=>{
          if(t.ruleType==='date' && t.completed && t.targetDate && t.targetDate>today()){
            changed=true;
            return {...t,completed:false,completedAt:null};
          }
          return t;
        });
        if(changed){ saveTasks(fixed); renderMain(); toast('Neu geplant'); }
      },80);
    },true);
  }
  function patchHistoryButtons(){
    const h=$('historyBtn');
    if(h && !h.dataset.historyFix){ h.dataset.historyFix='1'; h.addEventListener('click',()=>setTimeout(()=>{installHistorySwipe();renderAllHist();},0),true); }
    const list=$('list');
    if(list && !list.dataset.openHistFix){
      list.dataset.openHistFix='1';
      list.addEventListener('click',e=>{const r=e.target.closest('.card'); if(!r || e.target.closest('button')) return; setTimeout(()=>{installHistorySwipe();openHist(r.dataset.id);},0);},true);
    }
  }
  function boot(){ installCss(); renderMain(); installHistorySwipe(); patchSaveForFutureDone(); patchHistoryButtons(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();