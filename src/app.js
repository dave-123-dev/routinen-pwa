import { APP_VERSION } from './version.js';
import { initPullRefresh } from './pull-refresh.js';
import { initReminderNotifications } from './notifications.js';
import { completeTask, computeNextExecution, isTaskLike, latestHistoryEntry, normalizeTask, removeHistoryEntry, skipTask, taskState, updateHistoryEntry } from './domain/tasks.js';
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
import { $, hidePanel, showPanel, toast } from './ui/dom.js';
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
let editingHistory = null;
let bannerTimer = null;

function normalizeImportedTasks(rawTasks) {
  return rawTasks
    .filter(isTaskLike)
    .map(normalizeTask);
}

function extractImportTasks(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return null;

  const candidates = [
    data.tasks,
    data.items,
    data.habits,
    data.routines,
    data.data,
  ];
  return candidates.find(Array.isArray) || null;
}

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
  $('exportBtn').title = t.share;
  $('exportBtn').setAttribute('aria-label', t.share);
  $('importBtn').title = t.import;
  $('importBtn').setAttribute('aria-label', t.import);
  $('settingsBtn').title = t.settings;
  $('settingsBtn').setAttribute('aria-label', t.settings);
  $('historyEditTitle').textContent = t.editHistory;
  $('historyEditDateLabel').textContent = t.historyDate;
  $('historyEditTimeLabel').textContent = t.historyTime;
  $('historyEditCancel').textContent = t.cancel;
  $('historyEditSave').textContent = t.save;
  taskFormView.applyLanguage();
  importView.applyLanguage();
  settingsView.applyLanguage();
  render();
}

function localHistoryParts(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: localDate(), time: '00:00' };
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return {
    date: local.slice(0, 10),
    time: local.slice(11, 16),
  };
}

function openHistoryEdit(taskId, iso) {
  const task = findTask(taskId);
  const entry = task ? latestHistoryEntry({ ...task, history: task.history.filter(item => item.iso === iso || item === iso) }) : null;
  if (!task || !iso) return;
  const parts = localHistoryParts(iso);
  editingHistory = { taskId, iso, type: entry?.type || 'done' };
  $('historyEditDate').value = parts.date;
  $('historyEditTime').value = parts.time;
  showPanel('historyEditPanel');
}

function saveHistoryEdit() {
  if (!editingHistory) return;
  const date = $('historyEditDate').value;
  const time = $('historyEditTime').value || '00:00';
  const next = new Date(`${date}T${time}`);
  if (!date || Number.isNaN(next.getTime())) {
    toast(text().importError);
    return;
  }
  const nextIso = next.toISOString();
  tasks = tasks.map(task => (
    String(task.id) === String(editingHistory.taskId)
      ? updateHistoryEntry(task, editingHistory.iso, nextIso)
      : task
  ));
  persistTasks();
  hidePanel('historyEditPanel');
  editingHistory = null;
  render();
  if ($('history').classList.contains('show')) historyView.refresh();
}

function showHistoryEditBanner(sourceButton, taskId, iso) {
  const old = document.querySelector('.historyEditBanner');
  if (old) old.remove();
  if (bannerTimer) clearTimeout(bannerTimer);

  const banner = document.createElement('button');
  banner.type = 'button';
  banner.className = 'historyEditBanner';
  banner.textContent = text().editHistoryHint;
  banner.onclick = () => {
    banner.remove();
    openHistoryEdit(taskId, iso);
  };
  document.body.appendChild(banner);
  bannerTimer = setTimeout(() => banner.remove(), 5000);
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

function complete(id, sourceButton) {
  let newEntry = null;
  tasks = tasks.map(task => {
    if (String(task.id) !== String(id)) return task;
    const next = completeTask(task);
    newEntry = latestHistoryEntry(next);
    return next;
  });
  persistTasks();
  render();
  if (newEntry) showHistoryEditBanner(sourceButton, id, newEntry.iso);
}

function skip(id) {
  tasks = tasks.map(task => (String(task.id) === String(id) ? skipTask(task) : task));
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
  const filename = `routinen-${localDate()}.json`;
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importText(value) {
  const data = JSON.parse(value);
  const rawTasks = extractImportTasks(data);
  if (!Array.isArray(rawTasks)) throw new Error('Kein lesbares Aufgaben-Array gefunden');
  if (data.language) {
    lang = normalizeLanguage(data.language);
    saveLanguage(lang);
  }
  tasks = normalizeImportedTasks(rawTasks);
  if (!tasks.length && rawTasks.length) throw new Error('Importdatei enthält keine lesbaren Aufgaben');
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
  onSkip: skip,
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
  onEditEntry: openHistoryEdit,
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
  onEditHistory: openHistoryEdit,
});

function bind() {
  taskListView.bind();
  taskFormView.bind();
  historyView.bind();
  importView.bind();
  settingsView.bind();
  pastView.bind();
  $('historyEditCancel').onclick = () => hidePanel('historyEditPanel');
  $('historyEditSave').onclick = saveHistoryEdit;
  $('exportBtn').onclick = exportJSON;
  document.addEventListener('click', () => saveUiState({
    tab: pastView.tab,
    compact: pastView.compact,
  }), true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    tasks = loadTasks();
    render();
  });
  window.addEventListener('pageshow', () => {
    tasks = loadTasks();
    render();
  });
}

function restoreUi() {
  const ui = loadUiState();
  pastView.setTab(ui.tab || 'current');
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
