(() => {
  const VERSION = 'v19';
  const threshold = 78;
  let startY = 0;
  let pulling = false;
  let distance = 0;

  function lang() {
    return (localStorage.getItem('habit_language_v1') || document.documentElement.lang || 'de').slice(0, 2);
  }

  function text(key) {
    const de = {
      pull: 'Zum Aktualisieren ziehen',
      release: 'Loslassen zum Aktualisieren',
      loading: 'Aktualisiere…'
    };
    const en = {
      pull: 'Pull to refresh',
      release: 'Release to refresh',
      loading: 'Refreshing…'
    };
    return (lang() === 'en' ? en : de)[key];
  }

  function ensureUi() {
    let el = document.getElementById('pullRefresh');
    if (el) return el;
    const style = document.createElement('style');
    style.id = 'pullRefreshStyle';
    style.textContent = `
      #pullRefresh{position:fixed;left:50%;top:10px;transform:translate(-50%,-72px);z-index:1000;background:var(--card);color:var(--text);border:1px solid var(--line);border-radius:999px;padding:10px 16px;font-size:13px;font-weight:850;box-shadow:0 12px 32px var(--shadow);transition:transform .18s ease,opacity .18s ease;opacity:0;pointer-events:none;white-space:nowrap}
      #pullRefresh.show{opacity:1}
    `;
    document.head.appendChild(style);
    el = document.createElement('div');
    el.id = 'pullRefresh';
    el.textContent = text('pull');
    document.body.appendChild(el);
    return el;
  }

  function setVersion() {
    const v = document.getElementById('version');
    if (v) v.textContent = VERSION;
  }

  async function refreshNow(el) {
    el.textContent = text('loading');
    el.style.transform = 'translate(-50%,12px)';
    try {
      if (navigator.serviceWorker) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      }
    } catch (_) {}
    setTimeout(() => location.reload(), 260);
  }

  function onStart(e) {
    if (window.scrollY > 0) return;
    if (!e.touches || e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    pulling = true;
    distance = 0;
  }

  function onMove(e) {
    if (!pulling || window.scrollY > 0) return;
    distance = e.touches[0].clientY - startY;
    if (distance <= 0) return;
    const el = ensureUi();
    const y = Math.min(distance * 0.45, 84);
    el.classList.add('show');
    el.textContent = distance > threshold ? text('release') : text('pull');
    el.style.transform = `translate(-50%,${y - 54}px)`;
    if (distance > 12) e.preventDefault();
  }

  function onEnd() {
    if (!pulling) return;
    const el = ensureUi();
    pulling = false;
    if (distance > threshold) {
      refreshNow(el);
      return;
    }
    el.style.transform = 'translate(-50%,-72px)';
    el.classList.remove('show');
    distance = 0;
  }

  function boot() {
    setVersion();
    ensureUi();
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
