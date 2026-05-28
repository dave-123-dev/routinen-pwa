export function initTaskButtonSymbols(){
  let scheduled=false;
  function apply(){
    document.querySelectorAll('.card .complete').forEach(button=>{
      const card=button.closest('.card');
      const tick=button.querySelector('.tick');
      if(!card||!tick)return;
      const isDone=card.classList.contains('done');
      tick.textContent=isDone?'↻':'○';
      tick.setAttribute('aria-hidden','true');
      button.classList.toggle('is-reschedule',isDone);
      button.classList.toggle('is-complete',!isDone);
    });
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  }
  apply();
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-check],[data-edit],[data-del],#saveBtn,#importPaste,#pickFile'))setTimeout(schedule,0);
  });
  document.addEventListener('routinen:render',schedule);
}
