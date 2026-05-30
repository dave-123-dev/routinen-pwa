import { historyEntries } from '../domain/tasks.js';
import { $ } from '../ui/dom.js';
import { renderPastTaskCard } from '../ui/task-card.js';

const PAGE_SIZE = 20;

export class PastView {
  constructor({ getTasks, getText, getLang, onReplay }) {
    this.getTasks = getTasks;
    this.getText = getText;
    this.getLang = getLang;
    this.onReplay = onReplay;
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
    $('pastList').onclick = event => {
      const replay = event.target.closest('[data-replay-id]');
      if (!replay || !event.target.closest('.pastReload')) return;
      const task = this.getTasks().find(item => String(item.id) === String(replay.dataset.replayId));
      if (task) this.onReplay(task);
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
        .compactToggle{margin-left:auto}
        .pastList{padding:0 24px 120px}
        .pastItem{position:relative;border:1px solid var(--line);border-radius:24px;padding:18px 62px 18px 18px;margin:0 0 14px;background:var(--surface);display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;box-shadow:var(--shadow)}
        .pastEmoji{font-size:34px}
        .pastTitle{font-size:20px;font-weight:900;color:var(--text)}
        .pastDate{font-size:15px;color:var(--muted);margin-top:4px}
        .pastReload{position:absolute;right:16px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:1px solid var(--line);border-radius:50%;background:transparent;color:var(--accent);font-size:20px}
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
      tabs.innerHTML = '<button data-tab="current"></button><button data-tab="past"></button><button id="compactToggle" class="compactToggle" type="button"></button>';
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
    document.querySelector('[data-tab="current"]').classList.toggle('on', this.tab === 'current');
    document.querySelector('[data-tab="past"]').classList.toggle('on', this.tab === 'past');
    $('compactToggle').textContent = this.compact ? text.detailedView : text.compactView;
    document.body.classList.toggle('compact', this.compact);
    $('list').style.display = this.tab === 'current' ? 'block' : 'none';
    $('pastList').style.display = this.tab === 'past' ? 'block' : 'none';
    this.renderPast();
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
}
