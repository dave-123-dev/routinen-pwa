import { historyEntries, taskMetaItems } from '../domain/tasks.js';
import { $, escapeHtml } from '../ui/dom.js';
import { renderPastTaskCard } from '../ui/task-card.js';
import { DAY_NAMES } from '../i18n/messages.js';

const PAGE_SIZE = 20;

export class PastView {
  constructor({ getTasks, getText, getLang, onReplay, onOpenHistory, onDeleteHistory }) {
    this.getTasks = getTasks;
    this.getText = getText;
    this.getLang = getLang;
    this.onReplay = onReplay;
    this.onOpenHistory = onOpenHistory;
    this.onDeleteHistory = onDeleteHistory;
    this.tab = 'current';
    this.compact = false;
    this.defaultView = 'detailed';
    this.shown = PAGE_SIZE;
  }

  bind() {
    this.ensureUi();
    $('viewTabs').onclick = event => {
      const tab = event.target.closest('[data-tab]');
      if (tab) {
        this.tab = tab.dataset.tab;
        this.shown = PAGE_SIZE;
        this.render();
      }
      if (event.target.closest('#compactToggle')) {
        this.compact = !this.compact;
        this.defaultView = this.compact ? 'compact' : 'detailed';
        this.render();
      }
    };
    $('historyBtn').onclick = () => {
      this.tab = 'history';
      this.shown = PAGE_SIZE;
      this.render();
    };
    $('pastList').onclick = event => {
      const deleteButton = event.target.closest('[data-history-delete]');
      if (deleteButton && this.tab === 'history' && this.onDeleteHistory) {
        this.onDeleteHistory(deleteButton.dataset.taskId, decodeURIComponent(deleteButton.dataset.iso), { reopen: false });
        return;
      }
      const replay = event.target.closest('[data-replay-id]');
      if (replay && event.target.closest('.pastReload')) {
        const task = this.getTasks().find(item => String(item.id) === String(replay.dataset.replayId));
        if (task) this.onReplay(task);
        return;
      }
      const card = event.target.closest('[data-task-id]');
      if (card && this.onOpenHistory) this.onOpenHistory(card.dataset.taskId);
    };
  }

  ensureUi() {
    if (!document.getElementById('past-view-style')) {
      const style = document.createElement('style');
      style.id = 'past-view-style';
      style.textContent = `
        .viewTabs{display:flex;gap:10px;margin:0 24px 16px}
        .viewTabs button,.compactToggle,.loadMorePast,.compactAction{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:999px;padding:12px 16px;font-weight:800}
        .viewTabs button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
        .viewTabs .historyTab{width:48px;padding:12px 0;display:inline-flex;align-items:center;justify-content:center}
        .compactToggle{margin-left:auto}
        .pastList{padding:0 24px 120px}
        .pastItem{position:relative;border:1px solid var(--line);border-radius:24px;padding:18px 62px 18px 18px;margin:0 0 14px;background:var(--surface);display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;box-shadow:var(--shadow)}
        .pastEmoji{font-size:34px}
        .pastTitle{font-size:20px;font-weight:900;color:var(--text)}
        .pastDate{font-size:15px;color:var(--muted);margin-top:4px}
        .pastReload{position:absolute;right:16px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:1px solid var(--line);border-radius:50%;background:transparent;color:var(--accent);font-size:20px}
        .historyGroup{border:1px solid var(--line);border-radius:24px;padding:18px;margin:0 0 14px;background:var(--surface);box-shadow:var(--shadow)}
        .historyGroup h3{margin:0 0 10px;font-size:20px}
        .historyRows{display:grid;gap:8px}
        .historyRow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--line)}
        .historyRow:first-child{border-top:0}
        .historyDelete{width:34px;height:34px;border:1px solid var(--line);border-radius:50%;background:transparent;color:var(--muted);font-size:18px}
        .loadMorePast{width:100%;margin:12px 0 30px}
        .compactDeadline,.compactActions{display:none}
        body.compact #list .card{display:grid;grid-template-columns:86px 1fr;gap:12px;align-items:center;padding:16px 18px}
        body.compact #list .card .meta,body.compact #list .card .status,body.compact #list .card .complete,body.compact #list .card .delSwipe,body.compact #list .card .edit{display:none!important}
        body.compact #list .card .taskTop{display:contents}
        body.compact #list .card .iconbox{width:72px;height:72px;font-size:32px}
        body.compact #list .card .titleRow{display:block}
        body.compact #list .card .taskTitle{font-size:22px;margin:0}
        body.compact #list .card .compactDeadline{display:block;color:var(--muted);font-size:14px;margin-top:6px}
        body.compact #list .card .compactActions{display:flex;gap:8px;margin-top:12px}
        body.compact #list .card .compactAction{width:38px;height:38px;padding:0;display:flex;align-items:center;justify-content:center;font-size:18px;border-radius:50%}
        body.compact #list .card .compactAction:disabled{opacity:.58}
      `;
      document.head.appendChild(style);
    }

    if (!$('viewTabs')) {
      const tabs = document.createElement('div');
      tabs.id = 'viewTabs';
      tabs.className = 'viewTabs';
      tabs.innerHTML = '<button data-tab="current"></button><button data-tab="past"></button><button data-tab="history" class="historyTab" type="button" aria-label="Verlauf">&#8635;</button><button id="compactToggle" class="compactToggle" type="button"></button>';
      $('list').parentNode.insertBefore(tabs, $('list'));
    }

    if (!$('pastList')) {
      const past = document.createElement('main');
      past.id = 'pastList';
      past.className = 'pastList';
      past.style.display = 'none';
      $('list').parentNode.insertBefore(past, $('list').nextSibling);
    }
  }

  setViewMode(mode) {
    this.defaultView = mode === 'compact' ? 'compact' : 'detailed';
    this.compact = this.defaultView === 'compact';
  }

  getViewMode() {
    return this.compact ? 'compact' : 'detailed';
  }

  render() {
    this.ensureUi();
    const text = this.getText();
    document.querySelector('[data-tab="current"]').textContent = text.current;
    document.querySelector('[data-tab="past"]').textContent = text.past;
    document.querySelector('[data-tab="history"]').setAttribute('title', text.history);
    document.querySelector('[data-tab="history"]').setAttribute('aria-label', text.history);
    document.querySelector('[data-tab="current"]').classList.toggle('on', this.tab === 'current');
    document.querySelector('[data-tab="past"]').classList.toggle('on', this.tab === 'past');
    document.querySelector('[data-tab="history"]').classList.toggle('on', this.tab === 'history');
    $('compactToggle').textContent = this.compact ? text.detailedView : text.compactView;
    document.body.classList.toggle('compact', this.compact);
    $('list').style.display = this.tab === 'current' ? 'block' : 'none';
    $('pastList').style.display = this.tab === 'current' ? 'none' : 'block';
    if (this.tab === 'history') {
      this.renderHistory();
    } else {
      this.renderPast();
    }
  }

  renderPast() {
    const text = this.getText();
    const entries = historyEntries(this.getTasks());
    if (!entries.length) {
      $('pastList').innerHTML = `<div class="empty">${text.emptyPast}</div>`;
      return;
    }

    const visible = entries.slice(0, this.shown)
      .map(entry => renderPastTaskCard(entry, this.getLang()))
      .join('');
    $('pastList').innerHTML = visible + (
      entries.length > this.shown
        ? `<button class="loadMorePast" id="loadMorePast">${text.more}</button>`
        : ''
    );
    const more = $('loadMorePast');
    if (more) more.onclick = () => {
      this.shown += PAGE_SIZE;
      this.renderPast();
    };
  }

  renderHistory() {
    const text = this.getText();
    const tasks = this.getTasks();
    const groups = tasks.map(task => {
      const rows = historyEntries([task]).map(entry => entry.iso);
      const meta = taskMetaItems(task, text, this.getLang(), DAY_NAMES[this.getLang()])
        .map(item => `<span class="meta-line">${escapeHtml(item)}</span>`)
        .join('');
      return `
        <section class="historyGroup">
          <h3>${escapeHtml(`${task.emoji ? `${task.emoji} ` : ''}${task.title}`)}</h3>
          <div class="meta">${meta || text.noHistory}</div>
          <div class="historyRows">${
            rows.length
              ? rows.map(iso => `
                <div class="historyRow">
                  <div>${escapeHtml(new Date(iso).toLocaleString(this.getLang() === 'en' ? 'en-GB' : 'de-CH', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }))}</div>
                  <button class="historyDelete" data-history-delete="1" data-task-id="${task.id}" data-iso="${encodeURIComponent(iso)}">&times;</button>
                </div>
              `).join('')
              : `<div class="empty">${text.noHistory}</div>`
          }</div>
        </section>
      `;
    }).join('');
    $('pastList').innerHTML = groups || `<div class="empty">${text.noHistory}</div>`;
  }
}
