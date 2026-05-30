import {
  addDays,
  formatDateTime,
  localDate,
  localDateTime,
  localTime,
  nextWeekEnd,
  nextWeekday,
  parseDateTime,
  toDateTime,
  weekEnd,
} from './dates.js';

export const TASK_RULES = {
  DATE: 'date',
  WEEKDAY: 'weekday',
  INTERVAL: 'interval',
};

export const TASK_GROUPS = ['today', 'tomorrow', 'week', 'nextweek', 'later', 'open'];

export function intervalMs(task) {
  const amount = Math.max(1, Number(task.intervalAmount || 1));
  return amount * (task.intervalUnit === 'hours' ? 3600000 : 60000);
}

export function firstInterval(task) {
  const base = parseDateTime(toDateTime(
    task.intervalStartDate || localDate(),
    task.intervalStartTime || localTime(),
  ));
  const date = base || new Date();
  date.setTime(date.getTime() + intervalMs(task));
  return localDateTime(date);
}

export function nextIntervalAfter(task, after = new Date()) {
  let date = parseDateTime(task.nextExecution) || parseDateTime(firstInterval(task)) || new Date();
  const step = intervalMs(task);
  while (date <= after) date = new Date(date.getTime() + step);
  return localDateTime(date);
}

export function computeNextExecution(task, reason = 'save') {
  if (task.ruleType === TASK_RULES.INTERVAL) {
    return reason === 'done'
      ? nextIntervalAfter(task, new Date())
      : task.nextExecution || firstInterval(task);
  }

  if (task.ruleType === TASK_RULES.WEEKDAY) {
    const time = task.reminderTime || '00:00';
    if (reason === 'done') {
      if (task.allowMultiplePerDay) return task.nextExecution || toDateTime(localDate(), time);
      return nextWeekday(addDays(localDate(), 1), task.weekdays, time, true);
    }
    return task.nextExecution || nextWeekday(localDate(), task.weekdays, time, true);
  }

  return toDateTime(task.targetDate, task.targetTime || '23:59');
}

export function normalizeTask(raw = {}) {
  const task = { ...raw };
  task.ruleType = task.ruleType === 'weekdays' ? TASK_RULES.WEEKDAY : task.ruleType || TASK_RULES.DATE;
  task.title = task.title || '';
  task.details = task.details || '';
  task.emoji = task.emoji || '';
  task.targetDate = task.targetDate || '';
  task.targetTime = task.targetTime || '';
  task.endDateTime = toDateTime(task.targetDate, task.targetTime || '23:59');
  task.weekdays = Array.isArray(task.weekdays)
    ? [...new Set(task.weekdays.map(Number).filter(value => value >= 0 && value <= 6))].sort((a, b) => a - b)
    : [];
  task.allowMultiplePerDay = Boolean(task.allowMultiplePerDay);
  task.intervalAmount = Math.max(1, Number(task.intervalAmount || 1));
  task.intervalUnit = task.intervalUnit === 'hours' ? 'hours' : 'minutes';
  task.intervalStartDate = task.intervalStartDate || localDate();
  task.intervalStartTime = task.intervalStartTime || localTime();
  task.reminderTime = task.reminderTime || '';
  task.completed = task.ruleType === TASK_RULES.DATE && Boolean(task.completed);
  task.completedAt = task.completedAt || null;
  task.lastDone = task.lastDone || null;
  task.lastDoneDay = task.lastDoneDay || ((task.lastDone || task.completedAt || '').slice(0, 10) || null);
  task.history = Array.isArray(task.history) ? task.history : [];
  task.id = task.id || Date.now() + Math.random();
  task.nextExecution = task.nextExecution || computeNextExecution(task, 'save');
  if (task.ruleType === TASK_RULES.DATE) task.nextExecution = computeNextExecution(task, 'save');
  return task;
}

export function isDateTaskDone(task) {
  return task.ruleType === TASK_RULES.DATE && task.completed;
}

export function isDisabledToday(task, today = localDate()) {
  return task.ruleType === TASK_RULES.WEEKDAY
    && !task.allowMultiplePerDay
    && task.lastDoneDay === today;
}

export function taskState(task, text, now = new Date()) {
  if (isDateTaskDone(task)) return { key: 'done', label: text.done, rank: 9 };

  const next = parseDateTime(task.nextExecution);
  const nextDate = String(task.nextExecution || '').slice(0, 10);
  if (!next) return { key: 'open', label: text.open, rank: 6 };
  if (isDisabledToday(task)) return { key: 'later', label: text.doneToday, rank: 2.5 };
  if (next <= now) return { key: 'today', label: text.todayDue, rank: 0 };
  if (nextDate === addDays(localDate(now), 1)) return { key: 'tomorrow', label: text.tomorrow, rank: 1 };
  if (nextDate <= weekEnd(localDate(now))) return { key: 'week', label: text.week, rank: 2 };
  if (nextDate <= nextWeekEnd(localDate(now))) return { key: 'nextweek', label: text.nextweek, rank: 3 };
  return { key: 'later', label: text.later, rank: 4 };
}

export function completeTask(task, now = new Date()) {
  if (isDisabledToday(task, localDate(now))) return task;

  const iso = now.toISOString();
  const day = localDate(now);

  if (task.ruleType === TASK_RULES.DATE) {
    if (task.completed) {
      return normalizeTask({
        ...task,
        completed: false,
        completedAt: null,
        nextExecution: computeNextExecution(task, 'save'),
      });
    }

    return normalizeTask({
      ...task,
      completed: true,
      completedAt: iso,
      history: [...task.history, iso],
    });
  }

  const next = {
    ...task,
    lastDone: iso,
    lastDoneDay: day,
    history: [...task.history, iso],
  };
  next.nextExecution = computeNextExecution(next, 'done');
  return normalizeTask(next);
}

export function taskMetaItems(task, text, lang, dayNames) {
  const items = [];
  if (task.details) items.push(`${text.metaDetails}: ${task.details}`);
  if (task.ruleType === TASK_RULES.WEEKDAY) {
    items.push(`${text.metaDays}: ${task.weekdays.map(index => dayNames[index]).join(', ')}`);
  }
  if (task.ruleType === TASK_RULES.INTERVAL) {
    items.push(`${text.metaEvery}: ${task.intervalAmount} ${task.intervalUnit === 'hours' ? text.hours : text.minutes}`);
  }
  if (task.ruleType === TASK_RULES.DATE && task.endDateTime) {
    items.push(`${text.metaEnd}: ${formatDateTime(task.endDateTime, lang)}`);
  }
  if (task.nextExecution) items.push(`${text.metaNext}: ${formatDateTime(task.nextExecution, lang)}`);
  if (task.reminderTime) items.push(`${text.metaReminder}: ${task.reminderTime}`);
  if (task.lastDone || task.completedAt) {
    items.push(`${text.metaLast}: ${formatDateTime(task.lastDone || task.completedAt, lang)}`);
  }
  return items;
}

export function sortTasks(tasks, text) {
  return [...tasks].sort((a, b) => {
    const stateA = taskState(a, text);
    const stateB = taskState(b, text);
    const timeA = parseDateTime(a.nextExecution)?.getTime() || 9e15;
    const timeB = parseDateTime(b.nextExecution)?.getTime() || 9e15;
    return stateA.rank - stateB.rank || timeA - timeB;
  });
}

export function historyEntries(tasks) {
  const entries = [];
  tasks.forEach(task => {
    (Array.isArray(task.history) ? task.history : []).forEach(iso => entries.push({ iso, task }));
    if (task.completedAt && !entries.some(entry => entry.iso === task.completedAt && String(entry.task.id) === String(task.id))) {
      entries.push({ iso: task.completedAt, task });
    }
  });
  return entries.sort((a, b) => new Date(b.iso) - new Date(a.iso));
}
