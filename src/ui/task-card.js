import { DAY_NAMES } from '../i18n/messages.js';
import { guessEmoji } from '../emoji.js';
import { isDateTaskDone, isDisabledToday, taskMetaItems, taskState } from '../domain/tasks.js';
import { escapeHtml } from './dom.js';

function metaHtml(task, text, lang) {
  return taskMetaItems(task, text, lang, DAY_NAMES[lang])
    .map(item => `<span class="meta-line">${escapeHtml(item)}</span>`)
    .join('');
}

export function renderTaskCard(task, text, lang) {
  const state = taskState(task, text);
  const done = isDateTaskDone(task);
  const disabled = isDisabledToday(task);
  const label = disabled ? text.doneToday : (done ? text.again : text.mark);
  const cardClass = `card ${state.key}`;
  const icon = escapeHtml(task.emoji || guessEmoji(task.title) || '✓');

  return `
    <article class="${cardClass}" data-id="${task.id}">
      <button class="delSwipe" data-del="${task.id}">${text.delete}</button>
      <div class="taskTop">
        <div class="iconbox">${icon}</div>
        <div>
          <div class="titleRow">
            <h3 class="taskTitle">${escapeHtml(task.title)}</h3>
            <button class="edit" data-edit="${task.id}" aria-label="${text.editTask}">${done ? '↻' : '✎'}</button>
          </div>
          <div class="meta">${metaHtml(task, text, lang)}</div>
          <div class="status">${state.label}</div>
        </div>
      </div>
      <button class="complete ${done ? 'is-reschedule' : 'is-complete'}" data-check="${task.id}" ${disabled ? 'disabled' : ''}>
        ${done ? '<span class="tick">↻</span>' : ''}
        <span>${label}</span>
      </button>
    </article>
  `;
}

export function renderPastTaskCard(entry, lang) {
  const date = new Date(entry.iso);
  const when = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(lang === 'en' ? 'en-GB' : 'de-CH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return `
    <article class="pastItem" data-replay-id="${entry.task.id}">
      <div class="pastEmoji">${escapeHtml(entry.task.emoji || '✓')}</div>
      <div>
        <div class="pastTitle">${escapeHtml(entry.task.title)}</div>
        <div class="pastDate">${escapeHtml(when)}</div>
      </div>
      <button class="pastReload" type="button" data-replay-id="${entry.task.id}" aria-label="Als neue Aufgabe übernehmen">↻</button>
    </article>
  `;
}
