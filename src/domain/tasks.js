import {
  addDays,
  addMinutes,
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

export const INTERVAL_ANCHOR_MODES = {
  START: 'start',
  LAST_DONE: 'lastDone',
};

export const REMINDER_MODES = {
  NONE: '',
  TIME: 'time',
  BEFORE: 'before',
};

export const HISTORY_TYPES = {
  DONE: 'done',
  SKIP: 'skip',
};

export const TASK_GROUPS = ['overdue', 'today', 'tomorrow', 'week', 'nextweek', 'later', 'open'];

const reminderClockPattern = /^\d{2}:\d{2}$/;

function asTaskObject(raw) {
  return raw && typeof raw === 'object' ? raw : {};
}

function normalizeHistoryEntry(entry) {
  if (typeof entry === 'string') return { iso: entry, type: HISTORY_TYPES.DONE };
  if (!entry || typeof entry !== 'object') return null;
  const iso = String(entry.iso || entry.date || entry.at || '');
  if (!iso) return null;
  return {
    iso,
    type: entry.type === HISTORY_TYPES.SKIP ? HISTORY_TYPES.SKIP : HISTORY_TYPES.DONE,
  };
}

function latestHistoryIso(history) {
  return history.length ? history.map(entry => entry.iso).sort().at(-1) : null;
}

function lastDoneHistory(history) {
  return history
    .filter(entry => entry.type === HISTORY_TYPES.DONE)
    .map(entry => entry.iso)
    .sort()
    .at(-1) || null;
}

export function intervalMs(task) {
  const amount = Math.max(1, Number(task.intervalAmount || 1));
  return amount * (task.intervalUnit === 'hours' ? 3600000 : 60000);
}

function intervalBase(task) {
  return parseDateTime(toDateTime(
    task.intervalStartDate || localDate(),
    task.intervalStartTime || localTime(),
  )) || new Date();
}

function intervalExecutionTime(task) {
  if (task.ruleType === TASK_RULES.WEEKDAY) return task.targetTime || '23:59';
  if (task.ruleType === TASK_RULES.DATE) return task.targetTime || '23:59';
  return '';
}

function nextIntervalOnGrid(task, after) {
  const base = intervalBase(task);
  const step = intervalMs(task);
  const date = new Date(base);
  date.setTime(date.getTime() + step);
  while (date <= after) date.setTime(date.getTime() + step);
  return localDateTime(date);
}

export function firstInterval(task) {
  return nextIntervalOnGrid(task, intervalBase(task));
}

export function nextIntervalAfter(task, after = new Date()) {
  if (task.intervalAnchorMode === INTERVAL_ANCHOR_MODES.START) {
    return nextIntervalOnGrid(task, after);
  }
  const step = intervalMs(task);
  const anchor = task.lastDone ? parseDateTime(task.lastDone) : null;
  if (anchor) return localDateTime(addMinutes(anchor, step / 60000));
  return nextIntervalOnGrid(task, after);
}

export function reminderSummary(task, text) {
  if (task.reminderMode === REMINDER_MODES.TIME && task.reminderTime) return task.reminderTime;
  if (task.reminderMode === REMINDER_MODES.BEFORE && task.reminderLeadMinutes > 0) {
    return `${task.reminderLeadMinutes} ${text.minutes} ${text.beforeShort}`;
  }
  return '';
}

export function computeNextExecution(task, reason = 'save') {
  if (task.ruleType === TASK_RULES.INTERVAL) {
    if (reason === 'done') return nextIntervalAfter(task, new Date());
    if (task.intervalAnchorMode === INTERVAL_ANCHOR_MODES.LAST_DONE && task.lastDone) {
      return nextIntervalAfter(task, parseDateTime(task.lastDone) || new Date());
    }
    return nextIntervalOnGrid(task, new Date(0));
  }

  if (task.ruleType === TASK_RULES.WEEKDAY) {
    const time = intervalExecutionTime(task);
    if (reason === 'done') {
      if (task.allowMultiplePerDay) return task.nextExecution || toDateTime(localDate(), time);
      return nextWeekday(addDays(localDate(), 1), task.weekdays, time, true);
    }
    return nextWeekday(localDate(), task.weekdays, time, true);
  }

  return toDateTime(task.targetDate, intervalExecutionTime(task));
}

export function normalizeTask(raw = {}) {
  const task = { ...asTaskObject(raw) };
  task.ruleType = task.ruleType === 'weekdays' ? TASK_RULES.WEEKDAY : task.ruleType || TASK_RULES.DATE;
  task.title = task.title || '';
  task.details = task.details || '';
  task.emoji = task.emoji || '';
  task.targetDate = task.targetDate || '';
  task.targetTime = reminderClockPattern.test(String(task.targetTime || '')) ? task.targetTime : '';
  task.endDateTime = toDateTime(task.targetDate, task.targetTime || '23:59');
  task.weekdays = Array.isArray(task.weekdays)
    ? [...new Set(task.weekdays.map(Number).filter(value => value >= 0 && value <= 6))].sort((a, b) => a - b)
    : [];
  task.allowMultiplePerDay = Boolean(task.allowMultiplePerDay);
  task.intervalAmount = Math.max(1, Number(task.intervalAmount || 1));
  task.intervalUnit = task.intervalUnit === 'hours' ? 'hours' : 'minutes';
  task.intervalStartDate = task.intervalStartDate || localDate();
  task.intervalStartTime = reminderClockPattern.test(String(task.intervalStartTime || ''))
    ? task.intervalStartTime
    : localTime();
  task.intervalAnchorMode = task.intervalAnchorMode === INTERVAL_ANCHOR_MODES.START
    ? INTERVAL_ANCHOR_MODES.START
    : INTERVAL_ANCHOR_MODES.LAST_DONE;
  task.reminderMode = [REMINDER_MODES.TIME, REMINDER_MODES.BEFORE].includes(task.reminderMode)
    ? task.reminderMode
    : REMINDER_MODES.NONE;
  task.reminderTime = reminderClockPattern.test(String(task.reminderTime || '')) ? task.reminderTime : '';
  task.reminderLeadMinutes = Math.max(0, Number(task.reminderLeadMinutes || 0));
  if (task.reminderMode === REMINDER_MODES.TIME && !task.reminderTime) task.reminderMode = REMINDER_MODES.NONE;
  if (task.reminderMode === REMINDER_MODES.BEFORE && task.reminderLeadMinutes <= 0) task.reminderMode = REMINDER_MODES.NONE;
  if (task.ruleType === TASK_RULES.INTERVAL && task.reminderMode === REMINDER_MODES.TIME) {
    task.reminderMode = REMINDER_MODES.NONE;
    task.reminderTime = '';
  }
  task.completed = task.ruleType === TASK_RULES.DATE && Boolean(task.completed);
  task.completedAt = task.completedAt || null;
  task.lastDone = task.lastDone || null;
  task.lastDoneDay = task.lastDoneDay || ((task.lastDone || task.completedAt || '').slice(0, 10) || null);
  task.history = Array.isArray(task.history)
    ? task.history.map(normalizeHistoryEntry).filter(Boolean)
    : [];
  task.id = task.id || Date.now() + Math.random();
  task.nextExecution = computeNextExecution(task, 'save');
  if (task.ruleType === TASK_RULES.DATE) task.nextExecution = computeNextExecution(task, 'save');
  return task;
}

export function isTaskLike(value) {
  return Boolean(value) && typeof value === 'object'
    && (
      typeof value.title === 'string'
      || typeof value.ruleType === 'string'
      || Array.isArray(value.weekdays)
      || typeof value.targetDate === 'string'
      || typeof value.intervalAmount !== 'undefined'
    );
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
  if (next < now) return { key: 'overdue', label: text.overdue, rank: -1 };
  if (nextDate === localDate(now)) return { key: 'today', label: text.todayDue, rank: 0 };
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
      });
    }

    return normalizeTask({
      ...task,
      completed: true,
      completedAt: iso,
      history: [...task.history, { iso, type: HISTORY_TYPES.DONE }],
    });
  }

  const next = {
    ...task,
    lastDone: iso,
    lastDoneDay: day,
    history: [...task.history, { iso, type: HISTORY_TYPES.DONE }],
  };
  next.nextExecution = computeNextExecution(next, 'done');
  return normalizeTask(next);
}

export function latestHistoryEntry(task) {
  return historyEntries([task])[0] || null;
}

export function skipTask(task, now = new Date()) {
  if (isDisabledToday(task, localDate(now))) return task;

  const iso = now.toISOString();
  const day = localDate(now);

  if (task.ruleType === TASK_RULES.DATE) {
    return normalizeTask({
      ...task,
      completed: true,
      completedAt: iso,
      history: [...task.history, { iso, type: HISTORY_TYPES.SKIP }],
    });
  }

  const next = {
    ...task,
    lastDone: iso,
    lastDoneDay: day,
    history: [...task.history, { iso, type: HISTORY_TYPES.SKIP }],
  };
  next.nextExecution = computeNextExecution(next, 'done');
  return normalizeTask(next);
}

export function taskMetaItems(task, text, lang, dayNames) {
  const items = [];
  if (task.details) items.push(`${text.metaDetails}: ${task.details}`);
  if (task.ruleType === TASK_RULES.WEEKDAY) {
    items.push(`${text.metaDays}: ${task.weekdays.map(index => dayNames[index]).join(', ')}`);
    if (task.targetTime) items.push(`${text.metaAt}: ${task.targetTime}`);
  }
  if (task.ruleType === TASK_RULES.INTERVAL) {
    items.push(`${text.metaEvery}: ${task.intervalAmount} ${task.intervalUnit === 'hours' ? text.hours : text.minutes}`);
    items.push(`${text.metaAnchor}: ${task.intervalAnchorMode === INTERVAL_ANCHOR_MODES.START ? text.anchorStart : text.anchorLastDone}`);
    if (task.intervalStartTime) items.push(`${text.metaAt}: ${task.intervalStartTime}`);
    if (task.nextExecution) items.push(`${text.metaNext}: ${formatDateTime(task.nextExecution, lang)}`);
  }
  if (task.ruleType === TASK_RULES.DATE && task.targetTime && task.endDateTime) {
    items.push(`${text.metaUntil}: ${formatDateTime(task.endDateTime, lang)}`);
  }
  const reminder = reminderSummary(task, text);
  if (reminder) items.push(`${text.metaReminder}: ${reminder}`);
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
    (Array.isArray(task.history) ? task.history : [])
      .map(normalizeHistoryEntry)
      .filter(Boolean)
      .forEach(entry => entries.push({ ...entry, task }));
    if (task.completedAt && !entries.some(entry => entry.iso === task.completedAt && String(entry.task.id) === String(task.id))) {
      entries.push({ iso: task.completedAt, type: HISTORY_TYPES.DONE, task });
    }
  });
  return entries.sort((a, b) => new Date(b.iso) - new Date(a.iso));
}

export function removeHistoryEntry(task, iso) {
  const history = task.history
    .map(normalizeHistoryEntry)
    .filter(entry => entry && entry.iso !== iso);
  const last = latestHistoryIso(history);

  if (task.ruleType === TASK_RULES.DATE && task.completedAt === iso) {
    return normalizeTask({
      ...task,
      history,
      completed: false,
      completedAt: null,
    });
  }

  return normalizeTask({
    ...task,
    history,
    lastDone: task.ruleType === TASK_RULES.WEEKDAY || task.ruleType === TASK_RULES.INTERVAL ? lastDoneHistory(history) : task.lastDone,
    lastDoneDay: last ? String(last).slice(0, 10) : null,
  });
}

export function updateHistoryEntry(task, oldIso, nextIso) {
  const history = task.history
    .map(normalizeHistoryEntry)
    .filter(Boolean)
    .map(entry => (entry.iso === oldIso ? { ...entry, iso: nextIso } : entry));
  const last = latestHistoryIso(history);
  const lastDone = lastDoneHistory(history);
  const updates = {
    ...task,
    history,
    lastDone: task.ruleType === TASK_RULES.WEEKDAY || task.ruleType === TASK_RULES.INTERVAL ? lastDone : task.lastDone,
    lastDoneDay: last ? String(last).slice(0, 10) : null,
  };

  if (task.ruleType === TASK_RULES.DATE && task.completedAt === oldIso) {
    updates.completedAt = nextIso;
  }

  return normalizeTask(updates);
}
