import { APP_VERSION } from './version.js';
import { initPullRefresh } from './pull-refresh.js';
import { initReminderNotifications } from './notifications-v31.js';
import { completeTask, computeNextExecution, normalizeTask } from './domain/tasks.js';
import { messagesFor, normalizeLanguage } from './i18n/messages.js';
import {
  loadLanguage,
  loadTasks,
  loadUiState,
  saveLanguage,
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
  $('historyBtn').textContent = t.history;
  $('exportBtn').textContent = t.share;
  $('importBtn').textContent = t.import;
  taskFormView.applyLanguage();
  importView.applyLanguage();
  settingsView.applyLanguage();
  render();
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
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(task => String(task.id) !== String(id));
  persistTasks();
  render();
  toast(text().deleted);
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

function saveSettings(nextLang) {
  lang = normalizeLanguage(nextLang);
  saveLanguage(lang);
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
});

const importView = new ImportView({
  getText: text,
  onImport: importText,
});

const settingsView = new SettingsView({
  getText: text,
  getLang: () => lang,
  onSave: saveSettings,
});

const pastView = new PastView({
  getTasks: () => tasks,
  getText: text,
  getLang: () => lang,
  onReplay: task => taskFormView.openFromTask(task),
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
  pastView.compact = Boolean(ui.compact);
}

function boot() {
  bind();
  restoreUi();
  applyLanguage();
  initPullRefresh();
  initReminderNotifications();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
}

boot();
