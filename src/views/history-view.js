import { formatDateTime } from '../domain/dates.js';
import { historyEntries, taskMetaItems } from '../domain/tasks.js';
import { DAY_NAMES } from '../i18n/messages.js';
import { $, escapeHtml } from '../ui/dom.js';

export class HistoryView {
  constructor({ getTasks, getText, getLang, onDeleteEntry }) {
    this.getTasks = getTasks;
    this.getText = getText;
    this.getLang = getLang;
    this.onDeleteEntry = onDeleteEntry;
  }

  bind() {
    $('histClose').onclick = () => $('history').classList.remove('show');
    $('histBody').onclick = event => {
      const button = event.target.closest('[data-history-delete]');
      if (!button) return;
      this.onDeleteEntry(button.dataset.taskId, decodeURIComponent(button.dataset.iso));
    };
  }

  meta(task) {
    return taskMetaItems(task, this.getText(), this.getLang(), DAY_NAMES[this.getLang()])
      .map(item => `<span class="meta-line">${escapeHtml(item)}</span>`)
      .join('');
  }

  row(taskId, entry) {
    return `<div class="hist"><span class="histIcon">${entry.type === 'skip' ? '↷' : '✓'}</span><button class="histDel" data-history-delete="1" data-task-id="${taskId}" data-iso="${encodeURIComponent(entry.iso)}">&times;</button>${escapeHtml(formatDateTime(entry.iso, this.getLang()))}</div>`;
  }

  openTask(id) {
    const task = this.getTasks().find(item => String(item.id) === String(id));
    if (!task) return;
    $('history').classList.add('show');
    $('histTitle').textContent = `${task.emoji ? `${task.emoji} ` : ''}${task.title}`;
    $('histBody').innerHTML = `<div class="meta">${this.meta(task)}</div>${
      historyEntries([task]).length
        ? historyEntries([task]).map(entry => this.row(task.id, entry)).join('')
        : `<div class="empty">${this.getText().noHistory}</div>`
    }`;
  }

  openAll() {
    const text = this.getText();
    const tasks = this.getTasks()
      .map(task => ({ task, entries: historyEntries([task]) }))
      .sort((a, b) => new Date(b.entries[0]?.iso || 0) - new Date(a.entries[0]?.iso || 0));
    $('history').classList.add('show');
    $('histTitle').textContent = text.history;
    $('histBody').innerHTML = tasks.map(({ task, entries }) => (
      `<h3>${escapeHtml(`${task.emoji ? `${task.emoji} ` : ''}${task.title}`)}</h3>${
        entries.length
          ? entries.map(entry => this.row(task.id, entry)).join('')
          : `<div class="meta">${text.noHistory}</div>`
      }`
    )).join('');
  }
}
