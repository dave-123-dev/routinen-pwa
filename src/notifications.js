const TASK_KEY = 'habit_tasks_v5';
const FIRED_KEY = 'routinen_reminders_fired_v1';
const pad = n => String(n).padStart(2, '0');
const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const readTasks = () => { try { return JSON.parse(localStorage.getItem(TASK_KEY) || '[]'); } catch { return []; } };
const readFired = () => { try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '{}'); } catch { return {}; } };
const writeFired = value => localStorage.setItem(FIRED_KEY, JSON.stringify(value));

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function hasReminder(task) {
  if (!task || !task.nextExecution || task.completed) return false;
  if (task.reminderMode === 'time') return Boolean(task.reminderTime);
  if (task.reminderMode === 'before') return Number(task.reminderLeadMinutes || 0) > 0;
  return false;
}

function hasReminders() {
  return readTasks().some(hasReminder);
}

function reminderDueTime(task) {
  const next = new Date(task.nextExecution || '');
  if (Number.isNaN(next.getTime())) return null;
  if (task.reminderMode === 'time') {
    const day = String(task.nextExecution || '').slice(0, 10);
    const time = String(task.reminderTime || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return null;
    const due = new Date(`${day}T${time}`);
    return Number.isNaN(due.getTime()) ? null : due;
  }
  if (task.reminderMode === 'before') {
    const lead = Number(task.reminderLeadMinutes || 0);
    if (lead <= 0) return null;
    return new Date(next.getTime() - lead * 60000);
  }
  return null;
}

function key(task) {
  return `${task.id}|${task.nextExecution || ''}|${task.reminderMode || ''}|${task.reminderTime || ''}|${task.reminderLeadMinutes || 0}`;
}

function skip(task) {
  return task.completed || (task.lastDoneDay === today() && !task.allowMultiplePerDay);
}

async function askPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'default' || !hasReminders()) return false;
  try { return (await Notification.requestPermission()) === 'granted'; } catch { return false; }
}

function show(task) {
  const title = `${task.emoji ? `${task.emoji} ` : ''}${task.title || 'Meine Routinen'}`;
  const body = task.details || 'Erinnerung ist fällig.';
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
      return;
    }
  } catch {}
  toast(`${title}: ${body}`);
}

function check() {
  const now = Date.now();
  const fired = readFired();
  let changed = false;
  readTasks().forEach(task => {
    if (!hasReminder(task) || skip(task)) return;
    const due = reminderDueTime(task);
    if (!due) return;
    const diff = now - due.getTime();
    if (diff < 0 || diff > 30 * 60 * 1000) return;
    const currentKey = key(task);
    if (fired[currentKey]) return;
    fired[currentKey] = new Date().toISOString();
    changed = true;
    show(task);
  });
  if (changed) writeFired(fired);
}

export function initReminderNotifications() {
  document.addEventListener('click', e => {
    if (e.target.closest('#saveBtn,[data-check],#importPaste,#pickFile,#settingsSave')) askPermission();
  }, true);
  document.addEventListener('change', e => {
    if (e.target.closest('#reminderMode,#reminderTime,#reminderLeadMinutes')) askPermission();
  }, true);
  setTimeout(check, 1000);
  setInterval(check, 30000);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
