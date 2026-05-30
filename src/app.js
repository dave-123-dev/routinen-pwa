import { APP_VERSION } from './version.js';
import { initPullRefresh } from './pull-refresh.js';
import { initReminderNotifications } from './notifications.js';
import { completeTask, computeNextExecution, normalizeTask, removeHistoryEntry, taskState } from './domain/tasks.js';
import { messagesFor, normalizeLanguage } from './i18n/messages.js';
import {
  loadLanguage,
  loadSettings,
  loadTasks,
  loadUiState,
  saveLanguage,
  saveSettings as persistSettings,
  saveTasks,
  saveUiState,
} from './storage/task-store.js';
import { localDate } from './domain/dates.js';
import { $, toast } from './ui/dom.js';
import { TaskListView } from './views/task-list-view.js';
import { TaskFormView } from './views/task-form-view.js';
import { HistoryView } from './views/history-view.js';
import { ImportView } from './views/import-view.js';
import { SettingsView } from './views/settings-view.js';
import { PastView } from './views/past-view.js';

let lang = normalizeLanguage(loadLanguage());
let tasks = loadTasks();
let settings = {
  viewMode: 'detailed',
  ...loadSettings(),
};

const text = () => messagesFor(lang);
const findTask = id => tasks.find(task => String(task.id) === String(id));

function persistTasks() {
  saveTasks(tasks);
}

function render() {
  taskListView.render();
  pastView.render();
}

function applyLanguage() {
  const t = text();
  document.documentElement.lang = lang;
  $('version').textContent = APP_VERSION;
  $('eyebrow').textContent = t.eyebrow;
  $('mainTitle').textContent = t.title;
  $('historyBtn').title = t.history;
  $('historyBtn').setAttribute('aria-label', t.history);
  $('exportBtn').title = t.share;
  $('exportBtn').setAttribute('aria-label', t.share);
  $('importBtn').title = t.import;
  $('importBtn').setAttribute('aria-label', t.import);
  taskFormView.applyLanguage();
  importView.applyLanguage();
  settingsView.applyLanguage();
  render();
}

function focusTaskInCurrentList(id) {
  requestAnimationFrame(() => {
    const card = [...document.querySelectorAll('#list [data-id]')].find(node => String(node.dataset.id) === String(id));
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function saveTask(editId, data) {
  const old = findTask(editId);
  const next = normalizeTask({
    ...old,
    ...data,
    id: editId || Date.now(),
    completed: old?.completed || false,
    completedAt: old?.completedAt || null,
    history: old?.history || [],
    nextExecution: '',
  });
  next.nextExecution = computeNextExecution(next, 'save');

  tasks = editId
    ? tasks.map(task => (String(task.id) === String(editId) ? next : task))
    : [...tasks, next];

  persistTasks();
  if (!editId && taskState(next, text()).key === 'overdue') {
    pastView.tab = 'current';
  }
  render();
  if (!editId && taskState(next, text()).key === 'overdue') focusTaskInCurrentList(next.id);
}

function deleteTask(id) {
  if (!window.confirm(text().confirmDeleteTask)) return;
  tasks = tasks.filter(task => String(task.id) !== String(id));
  persistTasks();
  render();
  toast(text().deleted);
}

function deleteHistoryEntry(taskId, iso, options = {}) {
  if (!window.confirm(text().confirmDeleteHistory)) return;
  tasks = tasks.map(task => (
    String(task.id) === String(taskId)
      ? removeHistoryEntry(task, iso)
      : task
  ));
  persistTasks();
  render();
  if (options.reopen !== false) historyView.openAll();
  toast(text().deleteHistory);
}

function complete(id) {
  tasks = tasks.map(task => (String(task.id) === String(id) ? completeTask(task) : task));
  persistTasks();
  render();
}

function exportJSON() {
  const payload = {
    version: 10,
    appVersion: APP_VERSION,
    language: lang,
    exportedAt: new Date().toISOString(),
    tasks,
  };
  const file = new File(
    [JSON.stringify(payload, null, 2)],
    `routinen-${localDate()}.json`,
    { type: 'application/json' },
  );
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(file);
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function importText(value) {
  const data = JSON.parse(value);
  const rawTasks = data.tasks || data;
  if (!Array.isArray(rawTasks)) throw new Error('Kein tasks-Array gefunden');
  if (data.language) {
    lang = normalizeLanguage(data.language);
    saveLanguage(lang);
  }
  tasks = rawTasks.map(normalizeTask);
  persistTasks();
  applyLanguage();
  return tasks.length;
}

function saveAppSettings(nextSettings) {
  lang = normalizeLanguage(nextSettings.language);
  saveLanguage(lang);
  settings = {
    ...settings,
    viewMode: nextSettings.viewMode === 'compact' ? 'compact' : 'detailed',
  };
  persistSettings(settings);
  pastView.setViewMode(settings.viewMode);
  applyLanguage();
}

const taskListView = new TaskListView({
  getTasks: () => tasks,
  getText: text,
  getLang: () => lang,
  onComplete: complete,
  onDelete: deleteTask,
  onEdit: id => taskFormView.openEdit(id),
  onOpenHistory: id => historyView.openTask(id),
});

const taskFormView = new TaskFormView({
  getText: text,
  getLang: () => lang,
  findTask,
  onSave: saveTask,
  onDelete: deleteTask,
});

const historyView = new HistoryView({
  getTasks: () => tasks,
  getText: text,
  getLang: () => lang,
  onDeleteEntry: deleteHistoryEntry,
});

const importView = new ImportView({
  getText: text,
  onImport: importText,
});

const settingsView = new SettingsView({
  getText: text,
  getLang: () => lang,
  getViewMode: () => settings.viewMode,
  onSave: saveAppSettings,
});

const pastView = new PastView({
  getTasks: () => tasks,
  getText: text,
  getLang: () => lang,
  onReplay: task => taskFormView.openFromTask(task),
  onOpenHistory: id => historyView.openTask(id),
  onDeleteHistory: deleteHistoryEntry,
});

function bind() {
  taskListView.bind();
  taskFormView.bind();
  historyView.bind();
  importView.bind();
  settingsView.bind();
  pastView.bind();
  $('exportBtn').onclick = exportJSON;
  document.addEventListener('click', () => saveUiState({
    tab: pastView.tab,
    compact: pastView.compact,
  }), true);
}

function restoreUi() {
  const ui = loadUiState();
  pastView.tab = ui.tab || 'current';
  pastView.setViewMode(settings.viewMode);
  if (Object.hasOwn(ui, 'compact')) pastView.compact = Boolean(ui.compact);
}

function boot() {
  bind();
  restoreUi();
  applyLanguage();
  initPullRefresh();
  initReminderNotifications();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js', { type: 'module' });
}

boot();
