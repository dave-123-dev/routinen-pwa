import { formatDateTime } from '../domain/dates.js';
import { taskMetaItems } from '../domain/tasks.js';
import { DAY_NAMES } from '../i18n/messages.js';
import { $, escapeHtml } from '../ui/dom.js';

export class HistoryView {
  constructor({ getTasks, getText, getLang }) {
    this.getTasks = getTasks;
    this.getText = getText;
    this.getLang = getLang;
  }

  bind() {
    $('historyBtn').onclick = () => this.openAll();
    $('histClose').onclick = () => $('history').classList.remove('show');
  }

  meta(task) {
    return taskMetaItems(task, this.getText(), this.getLang(), DAY_NAMES[this.getLang()])
      .map(item => `<span class="meta-line">${escapeHtml(item)}</span>`)
      .join('');
  }

  row(iso) {
    return `<div class="hist">${escapeHtml(formatDateTime(iso, this.getLang()))}</div>`;
  }

  openTask(id) {
    const task = this.getTasks().find(item => String(item.id) === String(id));
    if (!task) return;
    $('history').classList.add('show');
    $('histTitle').textContent = `${task.emoji ? `${task.emoji} ` : ''}${task.title}`;
    $('histBody').innerHTML = `<div class="meta">${this.meta(task)}</div>${
      task.history?.length
        ? task.history.slice().reverse().map(iso => this.row(iso)).join('')
        : `<div class="empty">${this.getText().noHistory}</div>`
    }`;
  }

  openAll() {
    const text = this.getText();
    $('history').classList.add('show');
    $('histTitle').textContent = text.history;
    $('histBody').innerHTML = this.getTasks().map(task => (
      `<h3>${escapeHtml(`${task.emoji ? `${task.emoji} ` : ''}${task.title}`)}</h3>${
        task.history?.length
          ? task.history.slice().reverse().map(iso => this.row(iso)).join('')
          : `<div class="meta">${text.noHistory}</div>`
      }`
    )).join('');
  }
}
