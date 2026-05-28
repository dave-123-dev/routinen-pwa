(() => {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    const panel = document.getElementById('importPanel');
    const paste = document.getElementById('paste');
    const importPaste = document.getElementById('importPaste');
    if (!panel || document.getElementById('importFile')) return;

    const box = document.createElement('div');
    box.style.border = '1.5px dashed var(--line)';
    box.style.borderRadius = '18px';
    box.style.background = 'var(--bg)';
    box.style.padding = '18px';
    box.style.textAlign = 'center';
    box.style.marginBottom = '14px';

    box.innerHTML = `
      <p style="margin:0 0 12px;color:var(--muted);font-size:14px">JSON-Datei aus Dateien/iCloud auswählen</p>
      <input id="importFile" type="file" accept="application/json,.json" style="display:none">
      <button id="pickFile" class="btn save" style="width:100%">Datei auswählen</button>
    `;

    if (paste) panel.insertBefore(box, paste);
    else panel.appendChild(box);

    function toast(msg) {
      const t = document.getElementById('toast');
      if (!t) return alert(msg);
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2200);
    }

    function normalizeTask(t) {
      const days = Array.isArray(t.weekdays) ? t.weekdays : (Number.isInteger(t.weekday) ? [t.weekday] : []);
      return {
        id: t.id || Date.now() + Math.random(),
        title: t.title || '',
        emoji: t.emoji || '',
        ruleType: t.ruleType || 'date',
        targetDate: t.targetDate || '',
        weekdays: [...new Set(days.map(Number).filter(n => n >= 0 && n <= 6))].sort((a, b) => a - b),
        reminderTime: t.reminderTime || '',
        completed: !!t.completed,
        completedAt: t.completedAt || null,
        lastDone: t.lastDone || null,
        history: Array.isArray(t.history) ? t.history : []
      };
    }

    function doImport(text) {
      const data = JSON.parse(text);
      const raw = data.tasks || data;
      if (!Array.isArray(raw)) throw new Error('Kein tasks-Array gefunden');
      const imported = raw.map(normalizeTask);
      localStorage.setItem('habit_tasks_v5', JSON.stringify(imported));
      toast(imported.length + ' Aufgaben geladen');
      setTimeout(() => location.reload(), 450);
    }

    const fileInput = document.getElementById('importFile');
    const pickFile = document.getElementById('pickFile');

    pickFile.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { doImport(ev.target.result); }
        catch (err) { toast('Importfehler: ' + err.message); }
        e.target.value = '';
      };
      reader.onerror = () => toast('Datei konnte nicht gelesen werden');
      reader.readAsText(file);
    });

    if (importPaste && paste) {
      importPaste.onclick = () => {
        try { doImport(paste.value); }
        catch (err) { toast('Importfehler: ' + err.message); }
      };
    }
  });
})();