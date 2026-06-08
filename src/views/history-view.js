import { formatDateTime } from '../domain/dates.js';
import { historyEntries, taskMetaItems } from '../domain/tasks.js';
import { DAY_NAMES } from '../i18n/messages.js';
import { $, escapeHtml } from '../ui/dom.js';

const INITIAL_HISTORY_LIMIT = 2;
const HISTORY_STEP = 5;
const eventIcon = type => (type === 'archive' ? '&#128451;' : (type === 'skip' ? '↷' : '✓'));

export class HistoryView {
  constructor({ getTasks, getText, getLang, onDeleteEntry, onEditEntry }) {
    this.getTasks = getTasks;
    this.getText = getText;
    this.getLang = getLang;
    this.onDeleteEntry = onDeleteEntry;
    this.onEditEntry = onEditEntry;
    this.expanded = new Map();
    this.active = { mode: null, id: null };
    this.globalShown = INITIAL_HISTORY_LIMIT;
  }

  bind() {
    $('histClose').onclick = () => $('history').classList.remove('show');
    $('histBody').onclick = event => {
      const more = event.target.closest('[data-history-more]');
      if (more) {
        const key = more.dataset.historyMore;
        if (key === 'global') {
          this.globalShown += HISTORY_STEP;
        } else {
          this.expanded.set(key, (this.expanded.get(key) || INITIAL_HISTORY_LIMIT) + HISTORY_STEP);
        }
        this.refresh();
        return;
      }

      const button = event.target.closest('[data-history-delete]');
      if (button) {
        this.onDeleteEntry(button.dataset.taskId, decodeURIComponent(button.dataset.iso));
        return;
      }

      const item = event.target.closest('button[data-history-edit]');
      if (item) this.onEditEntry(item.dataset.taskId, decodeURIComponent(item.dataset.iso));
    };
  }

  meta(task) {
    return taskMetaItems(task, this.getText(), this.getLang(), DAY_NAMES[this.getLang()])
      .map(item => `<span class="meta-line">${escapeHtml(item)}</span>`)
      .join('');
  }

  rows(task, entries) {
    const text = this.getText();
    const key = String(task.id);
    const limit = this.expanded.get(key) || INITIAL_HISTORY_LIMIT;
    const visible = entries.slice(0, limit).map(entry => `
      <div class="hist">
        <span class="histIcon">${eventIcon(entry.type)}</span>
        <button class="histEdit" type="button" data-history-edit="1" data-task-id="${task.id}" data-iso="${encodeURIComponent(entry.iso)}" aria-label="${text.editHistory}">✎</button>
        <button class="histDel" data-history-delete="1" data-task-id="${task.id}" data-iso="${encodeURIComponent(entry.iso)}">&times;</button>
        ${escapeHtml(formatDateTime(entry.iso, this.getLang()))}
      </div>
    `).join('');
    return visible + (entries.length > limit
      ? `<button class="historyMore" type="button" data-history-more="${key}" aria-label="${text.moreHistory}">⌄</button>`
      : '');
  }

  openTask(id) {
    const task = this.getTasks().find(item => String(item.id) === String(id));
    if (!task) return;
    this.active = { mode: 'task', id };
    $('history').classList.add('show');
    $('histTitle').textContent = `${task.emoji ? `${task.emoji} ` : ''}${task.title}`;
    const entries = historyEntries([task]);
    $('histBody').innerHTML = `<div class="meta">${this.meta(task)}</div>${
      entries.length
        ? this.rows(task, entries)
        : `<div class="empty">${this.getText().noHistory}</div>`
    }`;
  }

  openAll() {
    const text = this.getText();
    this.active = { mode: 'all', id: null };
    const entries = historyEntries(this.getTasks());
    const visible = entries.slice(0, this.globalShown);
    $('history').classList.add('show');
    $('histTitle').textContent = text.history;
    $('histBody').innerHTML = visible.length
      ? visible.map(entry => `
        <div class="hist">
          <span class="histIcon">${eventIcon(entry.type)}</span>
          <button class="histEdit" type="button" data-history-edit="1" data-task-id="${entry.task.id}" data-iso="${encodeURIComponent(entry.iso)}" aria-label="${text.editHistory}">✎</button>
          <button class="histDel" data-history-delete="1" data-task-id="${entry.task.id}" data-iso="${encodeURIComponent(entry.iso)}">&times;</button>
          <strong>${escapeHtml(`${entry.task.emoji ? `${entry.task.emoji} ` : ''}${entry.task.title}`)}</strong><br>
          ${escapeHtml(formatDateTime(entry.iso, this.getLang()))}
        </div>
      `).join('') + (entries.length > this.globalShown
        ? `<button class="historyMore" type="button" data-history-more="global" aria-label="${text.moreHistory}">⌄</button>`
        : '')
      : `<div class="meta">${text.noHistory}</div>`;
  }

  refresh() {
    if (this.active.mode === 'task') this.openTask(this.active.id);
    if (this.active.mode === 'all') this.openAll();
  }
}
