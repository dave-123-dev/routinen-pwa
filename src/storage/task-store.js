import { isTaskLike, normalizeTask } from '../domain/tasks.js';

export const TASK_KEY = 'habit_tasks_v5';
export const OLD_TASK_KEY = 'habit_tasks_v3';
export const LANGUAGE_KEY = 'habit_language_v1';
export const UI_KEY = 'routinen_ui_v1';
export const SETTINGS_KEY = 'routinen_settings_v1';

export function loadTasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TASK_KEY) || localStorage.getItem(OLD_TASK_KEY) || '[]');
    return (Array.isArray(parsed) ? parsed : [])
      .filter(isTaskLike)
      .map(normalizeTask);
  } catch {
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks.map(normalizeTask)));
}

export function loadLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) || 'de';
}

export function saveLanguage(lang) {
  localStorage.setItem(LANGUAGE_KEY, lang);
}

export function loadUiState() {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveUiState(value) {
  localStorage.setItem(UI_KEY, JSON.stringify(value));
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(value) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
}
