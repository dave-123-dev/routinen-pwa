import './app-v29.js';

const KEY='habit_tasks_v5';
const pad=n=>String(n).padStart(2,'0');
function localDate(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function lang(){return (document.documentElement.lang||localStorage.getItem('habit_language_v1')||'de').slice(0,2)==='en'?'en':'de'}
function text(){return lang()==='en'?{today:'Due today',badge:'today'}:{today:'Heute fällig',badge:'heute'}}
function tasks(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function activeTodayIds(){const today=localDate();return new Set(tasks().filter(t=>!t.completed&&String(t.nextExecution||'').slice(0,10)===today).map(t=>String(t.id)))}
function section(label){return [...document.querySelectorAll('#list>.section')].find(el=>el.textContent.trim()===label)}
function applyTodayGrouping(){
  const ids=activeTodayIds();
  if(!ids.size)return;
  const label=text().today;
  const list=document.getElementById('list');
  if(!list)return;
  let sec=section(label);
  if(!sec){sec=document.createElement('div');sec.className='section';sec.textContent=label;list.insertBefore(sec,list.firstChild)}
  let anchor=sec;
  [...list.querySelectorAll('.card[data-id]')].forEach(card=>{
    if(!ids.has(String(card.dataset.id)))return;
    card.classList.remove('week','nextweek','later','tomorrow','open');
    card.classList.add('today');
    const st=card.querySelector('.status');
    if(st)st.textContent=label;
    list.insertBefore(card,anchor.nextSibling);
    anchor=card;
  });
  const badge=document.getElementById('badge');
  if(badge){badge.style.display='block';badge.textContent=ids.size+' '+text().badge}
}
function schedule(){setTimeout(applyTodayGrouping,0);setTimeout(applyTodayGrouping,120)}
schedule();
document.addEventListener('click',schedule,true);
document.addEventListener('change',schedule,true);
