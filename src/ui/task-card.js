import { formatDateTime } from '../domain/dates.js';
import { DAY_NAMES } from '../i18n/messages.js';
import { guessEmoji } from '../emoji.js';
import { isDateTaskDone, isDisabledToday, TASK_RULES, taskMetaItems, taskState } from '../domain/tasks.js';
import { escapeHtml } from './dom.js';

function metaHtml(task, text, lang) {
  return taskMetaItems(task, text, lang, DAY_NAMES[lang])
    .map(item => `<span class="meta-line">${escapeHtml(item)}</span>`)
    .join('');
}

function compactDeadlineText(task, lang) {
  if (task.ruleType !== TASK_RULES.DATE || !task.targetDate) return '';
  return formatDateTime(task.endDateTime || task.targetDate, lang);
}

function eventIcon(type) {
  if (type === 'archive') return '&#128230;';
  if (type === 'skip') return '↷';
  return '✓';
}

export function renderTaskCard(task, text, lang) {
  const state = taskState(task, text);
  const done = isDateTaskDone(task);
  const disabled = isDisabledToday(task);
  const label = disabled ? text.doneToday : (done ? text.again : text.mark);
  const cardClass = `card ${state.key}`;
  const icon = escapeHtml(task.emoji || guessEmoji(task.title) || '✓');
  const compactDeadline = escapeHtml(compactDeadlineText(task, lang));

  return `
    <article class="${cardClass}" data-id="${task.id}">
      <button class="delSwipe" data-del="${task.id}">${text.delete}</button>
      <div class="taskTop">
        <div class="iconbox">${icon}</div>
        <div>
          <div class="titleRow">
            <h3 class="taskTitle">${escapeHtml(task.title)}</h3>
            <div class="taskIconActions">
              <button class="edit" data-history="${task.id}" aria-label="${text.history}">&#9776;</button>
              <button class="edit archiveIcon" data-archive="${task.id}" aria-label="${text.archive}">&#128230;</button>
              <button class="edit skipIcon" data-skip="${task.id}" aria-label="${text.skip}" ${disabled ? 'disabled' : ''}>↷</button>
            </div>
          </div>
          ${compactDeadline ? `<div class="compactDeadline">${compactDeadline}</div>` : ''}
          <div class="meta">${metaHtml(task, text, lang)}</div>
          <div class="status">${state.label}</div>
          <div class="compactActions">
            <button class="compactAction" data-history="${task.id}" aria-label="${text.history}">&#9776;</button>
            <button class="compactAction archiveIcon" data-archive="${task.id}" aria-label="${text.archive}">&#128230;</button>
            <button class="compactAction skipIcon" data-skip="${task.id}" aria-label="${text.skip}" ${disabled ? 'disabled' : ''}>↷</button>
            <button class="compactAction" data-check="${task.id}" aria-label="${label}" ${disabled ? 'disabled' : ''}>✓</button>
          </div>
        </div>
      </div>
      <button class="complete ${done ? 'is-reschedule' : 'is-complete'}" data-check="${task.id}" ${disabled ? 'disabled' : ''}>
        ${done ? '<span class="tick">↻</span>' : ''}
        <span>${label}</span>
      </button>
    </article>
  `;
}

export function renderPastTaskCard(entry, lang, text) {
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
    <article class="pastItem" data-task-id="${entry.task.id}">
      <div class="pastEmoji">${escapeHtml(entry.task.emoji || '') || eventIcon(entry.type)}</div>
      <div>
        <div class="pastTitle"><span class="pastEventIcon">${eventIcon(entry.type)}</span>${escapeHtml(entry.task.title)}</div>
        <div class="pastDate">${escapeHtml(when)}</div>
      </div>
      <button class="pastEdit" type="button" data-history-edit="1" data-task-id="${entry.task.id}" data-iso="${encodeURIComponent(entry.iso)}" aria-label="${text.editHistory}">✎</button>
      <button class="pastReload" type="button" data-replay-id="${entry.task.id}" aria-label="Als neue Aufgabe übernehmen">↻</button>
    </article>
  `;
}
