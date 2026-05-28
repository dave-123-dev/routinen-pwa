export function initTaskButtonSymbols(){
  function apply(root=document){
    root.querySelectorAll('.card .complete').forEach(button=>{
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
  apply();
  const list=document.getElementById('list');
  if(list){
    new MutationObserver(()=>apply(list)).observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-check]')) setTimeout(()=>apply(),0);
  });
}
