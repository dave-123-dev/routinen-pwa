(() => {
  const VERSION = 'v20';
  function t(key){
    const lang = (localStorage.getItem('habit_language_v1') || document.documentElement.lang || 'de').slice(0,2);
    const dict = {
      de: { done:'Als erledigt markieren', doneAgain:'Erneut planen' },
      en: { done:'Mark as done', doneAgain:'Reschedule' }
    };
    return (dict[lang] || dict.de)[key] || key;
  }
  function boot(){
    const version = document.getElementById('version');
    if (version) version.textContent = VERSION;
    if (document.getElementById('uiV20Css')) return;
    const link = document.createElement('link');
    link.id = 'uiV20Css';
    link.rel = 'stylesheet';
    link.href = './ui-v20.css?v=20';
    document.head.appendChild(link);
    patchRenderCard();
  }
  function patchRenderCard(){
    if (typeof window.card !== 'function' || window.__v20CardPatched) return;
    window.__v20CardPatched = true;
    const oldCard = window.card;
    window.card = function(task){
      const base = oldCard(task);
      const tmp = document.createElement('div');
      tmp.innerHTML = base;
      const card = tmp.firstElementChild;
      if(!card) return base;
      const id = card.dataset.id || task.id;
      const cls = card.className || '';
      const title = card.querySelector('.name span:last-child')?.textContent || task.title || '';
      const emoji = card.querySelector('.emoji')?.textContent || task.emoji || '';
      const meta = card.querySelector('.meta')?.innerHTML || '';
      const status = card.querySelector('.status')?.textContent || '';
      const done = cls.includes('done');
      const editIcon = done ? '↻' : '✎';
      return `<div class="card v20-card ${cls}" data-id="${id}">
        <button class="delSwipe" data-del="${id}">Löschen</button>
        <div class="v20-grid">
          <div class="v20-iconbox">${emoji || '✓'}</div>
          <div class="v20-content">
            <div class="v20-title-row">
              <h3 class="v20-title">${escapeHtml(title)}</h3>
              <button class="v20-edit" data-edit="${id}" aria-label="Bearbeiten">${editIcon}</button>
            </div>
            <div class="v20-meta">${meta}</div>
            <div class="status" style="margin-top:12px">${escapeHtml(status)}</div>
          </div>
        </div>
        <button class="v20-complete check" data-check="${id}"><span class="tick">✓</span><span>${done ? t('doneAgain') : t('done')}</span></button>
      </div>`;
    };
    if (typeof window.render === 'function') window.render();
  }
  function escapeHtml(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
