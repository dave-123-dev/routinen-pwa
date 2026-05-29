const TASK_KEY='habit_tasks_v5';
const FIRED_KEY='routinen_reminders_fired_v1';
const pad=n=>String(n).padStart(2,'0');
const today=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const readTasks=()=>{try{return JSON.parse(localStorage.getItem(TASK_KEY)||'[]')}catch{return[]}};
const readFired=()=>{try{return JSON.parse(localStorage.getItem(FIRED_KEY)||'{}')}catch{return{}}};
const writeFired=v=>localStorage.setItem(FIRED_KEY,JSON.stringify(v));
function toast(msg){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000)}
function hasReminders(){return readTasks().some(t=>t&&t.reminderTime&&t.nextExecution&&!t.completed)}
function reminderTime(task){
  const d=String(task.nextExecution||'').slice(0,10);
  const r=String(task.reminderTime||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!/^\d{2}:\d{2}$/.test(r))return null;
  const x=new Date(`${d}T${r}`);
  return Number.isNaN(x.getTime())?null:x;
}
function key(task){return `${task.id}|${task.nextExecution||''}|${task.reminderTime||''}`}
function skip(task){return task.completed||(task.lastDoneDay===today()&&!task.allowMultiplePerDay)}
async function askPermission(){
  if(!('Notification' in window))return false;
  if(Notification.permission==='granted')return true;
  if(Notification.permission!=='default'||!hasReminders())return false;
  try{return (await Notification.requestPermission())==='granted'}catch{return false}
}
function show(task){
  const title=`${task.emoji?task.emoji+' ':''}${task.title||'Meine Routinen'}`;
  const body=task.details||'Erinnerung ist fällig.';
  try{if('Notification' in window&&Notification.permission==='granted'){new Notification(title,{body});return}}catch{}
  toast(`${title}: ${body}`);
}
function check(){
  const now=Date.now();
  const fired=readFired();
  let changed=false;
  readTasks().forEach(task=>{
    if(!task||!task.reminderTime||!task.nextExecution||skip(task))return;
    const due=reminderTime(task);
    if(!due)return;
    const diff=now-due.getTime();
    if(diff<0||diff>30*60*1000)return;
    const k=key(task);
    if(fired[k])return;
    fired[k]=new Date().toISOString();
    changed=true;
    show(task);
  });
  if(changed)writeFired(fired);
}
export function initReminderNotifications(){
  document.addEventListener('click',e=>{if(e.target.closest('#saveBtn,[data-check],#importPaste,#pickFile,#settingsSave'))askPermission()},true);
  document.addEventListener('change',e=>{if(e.target.closest('#reminder'))askPermission()},true);
  setTimeout(check,1000);
  setInterval(check,30000);
  window.addEventListener('focus',check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
}
