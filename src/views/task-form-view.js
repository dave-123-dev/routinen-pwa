import { localDate, localTime } from '../domain/dates.js';
import { INTERVAL_ANCHOR_MODES, REMINDER_MODES, TASK_RULES } from '../domain/tasks.js';
import { DAY_NAMES } from '../i18n/messages.js';
import { guessEmoji } from '../emoji.js';
import { $, hidePanel, showPanel, toast } from '../ui/dom.js';

const modeToRule = mode => (mode === 'weekdays' ? TASK_RULES.WEEKDAY : mode);
const ruleToMode = rule => (rule === TASK_RULES.WEEKDAY ? 'weekdays' : rule || TASK_RULES.DATE);

export class TaskFormView {
  constructor({ getText, getLang, findTask, onSave, onDelete }) {
    this.getText = getText;
    this.getLang = getLang;
    this.findTask = findTask;
    this.onSave = onSave;
    this.onDelete = onDelete;
    this.editId = null;
    this.mode = TASK_RULES.DATE;
    this.selectedDays = [];
    this.emojiManual = false;
    this.lastAutoEmoji = '';
  }

  bind() {
    $('fab').onclick = () => this.openAdd();
    $('cancel').onclick = () => hidePanel('form');
    $('saveBtn').onclick = () => this.save();
    $('deleteBtn').onclick = () => {
      this.onDelete(this.editId);
      hidePanel('form');
    };
    $('days').onclick = event => {
      const button = event.target.closest('[data-day]');
      if (!button) return;
      const day = Number(button.dataset.day);
      this.selectedDays = this.selectedDays.includes(day)
        ? this.selectedDays.filter(value => value !== day)
        : [...this.selectedDays, day].sort((a, b) => a - b);
      this.drawDays();
    };
    document.querySelectorAll('.tab').forEach(button => {
      button.onclick = () => this.setMode(button.dataset.mode);
    });
    ['input', 'keyup', 'paste', 'compositionend'].forEach(eventName => {
      $('title').addEventListener(eventName, () => setTimeout(() => this.autoEmoji(), 0));
    });
    $('emoji').addEventListener('input', () => {
      this.emojiManual = Boolean($('emoji').value.trim());
      this.lastAutoEmoji = '';
    });
    $('reminderMode').addEventListener('change', () => this.updateReminderUi());
  }

  applyLanguage() {
    const text = this.getText();
    $('dateTab').textContent = text.date;
    $('weekTab').textContent = text.weekdays;
    $('intervalTab').textContent = text.interval;
    $('targetLabel').textContent = text.target;
    $('endTimeLabel').textContent = text.endTime;
    $('weekdaysLabel').textContent = text.weekdaysDo;
    $('weekTargetTimeLabel').textContent = text.weekEndTime;
    $('allowMultiLabel').textContent = text.allowMulti;
    $('intervalEveryLabel').textContent = text.intervalEvery;
    $('intervalUnitLabel').textContent = text.intervalUnit;
    $('intervalAnchorLabel').textContent = text.intervalAnchor;
    $('anchorStart').textContent = text.anchorStart;
    $('anchorLastDone').textContent = text.anchorLastDone;
    $('startDateLabel').textContent = text.startDate;
    $('startTimeLabel').textContent = text.startTime;
    $('reminderLabel').textContent = text.reminder;
    $('reminderNone').textContent = text.reminderNone;
    $('reminderAtTime').textContent = text.reminderAtTime;
    $('reminderBefore').textContent = text.reminderBefore;
    $('reminderTimeLabel').textContent = text.reminderAtTime;
    $('reminderLeadLabel').textContent = text.reminderLead;
    $('detailsLabel').textContent = text.details;
    $('cancel').textContent = text.cancel;
    $('saveBtn').textContent = text.save;
    $('deleteBtn').textContent = text.delete;
    $('unitMinutes').textContent = text.minutes;
    $('unitHours').textContent = text.hours;
    this.renderDays();
    this.updateReminderUi();
  }

  openAdd() {
    const text = this.getText();
    this.editId = null;
    this.selectedDays = [];
    this.emojiManual = false;
    this.lastAutoEmoji = '';
    this.setMode(TASK_RULES.DATE);
    $('formTitle').textContent = text.newTask;
    $('emoji').value = '';
    $('title').value = '';
    $('details').value = '';
    $('target').value = '';
    $('targetTime').value = '';
    $('weekTargetTime').value = '';
    $('reminderMode').value = REMINDER_MODES.NONE;
    $('reminderTime').value = '';
    $('reminderLeadMinutes').value = '';
    $('allowMulti').checked = false;
    $('intervalAmount').value = 1;
    $('intervalUnit').value = 'hours';
    $('intervalStartDate').value = localDate();
    $('intervalStartTime').value = localTime();
    $('intervalAnchorMode').value = INTERVAL_ANCHOR_MODES.LAST_DONE;
    $('deleteBtn').style.display = 'none';
    this.drawDays();
    this.updateReminderUi();
    showPanel('form');
  }

  openEdit(id) {
    const text = this.getText();
    const task = this.findTask(id);
    if (!task) return;
    this.editId = task.id;
    this.selectedDays = [...task.weekdays];
    this.emojiManual = Boolean(task.emoji);
    this.lastAutoEmoji = '';
    this.setMode(ruleToMode(task.ruleType));
    $('formTitle').textContent = task.completed ? text.reschedule : text.editTask;
    $('emoji').value = task.emoji || '';
    $('title').value = task.title || '';
    $('details').value = task.details || '';
    $('target').value = task.targetDate || '';
    $('targetTime').value = task.ruleType === TASK_RULES.DATE ? (task.targetTime || '') : '';
    $('weekTargetTime').value = task.ruleType === TASK_RULES.WEEKDAY ? (task.targetTime || '') : '';
    $('reminderMode').value = task.reminderMode || REMINDER_MODES.NONE;
    $('reminderTime').value = task.reminderTime || '';
    $('reminderLeadMinutes').value = task.reminderLeadMinutes || '';
    $('allowMulti').checked = Boolean(task.allowMultiplePerDay);
    $('intervalAmount').value = task.intervalAmount || 1;
    $('intervalUnit').value = task.intervalUnit || 'hours';
    $('intervalStartDate').value = task.intervalStartDate || localDate();
    $('intervalStartTime').value = task.intervalStartTime || localTime();
    $('intervalAnchorMode').value = task.intervalAnchorMode || INTERVAL_ANCHOR_MODES.LAST_DONE;
    $('deleteBtn').style.display = 'block';
    this.drawDays();
    this.updateReminderUi();
    showPanel('form');
  }

  openFromTask(task) {
    this.openAdd();
    setTimeout(() => {
      this.setMode(ruleToMode(task.ruleType));
      $('emoji').value = task.emoji || '';
      $('title').value = task.title || '';
      $('details').value = task.details || '';
      $('reminderMode').value = task.reminderMode || REMINDER_MODES.NONE;
      $('reminderTime').value = task.reminderTime || '';
      $('reminderLeadMinutes').value = task.reminderLeadMinutes || '';
      $('target').value = task.targetDate || '';
      $('targetTime').value = task.ruleType === TASK_RULES.DATE ? (task.targetTime || '') : '';
      $('weekTargetTime').value = task.ruleType === TASK_RULES.WEEKDAY ? (task.targetTime || '') : '';
      $('allowMulti').checked = Boolean(task.allowMultiplePerDay);
      $('intervalAmount').value = task.intervalAmount || 1;
      $('intervalUnit').value = task.intervalUnit || 'hours';
      $('intervalStartDate').value = task.intervalStartDate || localDate();
      $('intervalStartTime').value = task.intervalStartTime || localTime();
      $('intervalAnchorMode').value = task.intervalAnchorMode || INTERVAL_ANCHOR_MODES.LAST_DONE;
      this.selectedDays = Array.isArray(task.weekdays) ? [...task.weekdays] : [];
      this.drawDays();
      this.updateReminderUi();
    }, 30);
  }

  save() {
    const text = this.getText();
    const title = $('title').value.trim();
    if (!title) return toast(text.missingTitle);
    if (modeToRule(this.mode) === TASK_RULES.WEEKDAY && !this.selectedDays.length) return toast(text.chooseDay);

    const ruleType = modeToRule(this.mode);
    const reminderMode = this.sanitizedReminderMode(ruleType);
    const reminderTime = reminderMode === REMINDER_MODES.TIME ? ($('reminderTime').value || '') : '';
    const reminderLeadMinutes = reminderMode === REMINDER_MODES.BEFORE ? (Number($('reminderLeadMinutes').value) || 0) : 0;
    const targetTime = ruleType === TASK_RULES.DATE
      ? $('targetTime').value
      : (ruleType === TASK_RULES.WEEKDAY ? $('weekTargetTime').value : '');

    this.onSave(this.editId, {
      title,
      details: $('details').value.trim(),
      emoji: $('emoji').value.trim() || guessEmoji(title),
      reminderMode,
      reminderTime,
      reminderLeadMinutes,
      ruleType,
      targetDate: $('target').value,
      targetTime,
      weekdays: [...this.selectedDays],
      allowMultiplePerDay: $('allowMulti').checked,
      intervalAmount: Number($('intervalAmount').value) || 1,
      intervalUnit: $('intervalUnit').value,
      intervalStartDate: $('intervalStartDate').value || localDate(),
      intervalStartTime: $('intervalStartTime').value || localTime(),
      intervalAnchorMode: $('intervalAnchorMode').value || INTERVAL_ANCHOR_MODES.LAST_DONE,
    });

    hidePanel('form');
    toast(text.saved);
  }

  setMode(mode) {
    this.mode = modeToRule(mode);
    document.querySelectorAll('.tab').forEach(button => {
      button.classList.toggle('on', modeToRule(button.dataset.mode) === this.mode);
    });
    [
      [TASK_RULES.DATE, 'datePart'],
      [TASK_RULES.WEEKDAY, 'weekdaysPart'],
      [TASK_RULES.INTERVAL, 'intervalPart'],
    ].forEach(([rule, id]) => {
      const element = $(id);
      if (element) element.style.display = rule === this.mode ? 'block' : 'none';
    });
    this.updateReminderUi();
  }

  sanitizedReminderMode(ruleType) {
    if (ruleType === TASK_RULES.INTERVAL) {
      return (Number($('reminderLeadMinutes').value) || 0) > 0 ? REMINDER_MODES.BEFORE : REMINDER_MODES.NONE;
    }
    return $('reminderMode').value || REMINDER_MODES.NONE;
  }

  updateReminderUi() {
    const isInterval = this.mode === TASK_RULES.INTERVAL;
    const reminderMode = isInterval ? REMINDER_MODES.BEFORE : ($('reminderMode').value || REMINDER_MODES.NONE);
    $('reminderMode').style.display = isInterval ? 'none' : 'block';
    $('reminderTimeWrap').style.display = !isInterval && reminderMode === REMINDER_MODES.TIME ? 'block' : 'none';
    $('reminderLeadWrap').style.display = reminderMode === REMINDER_MODES.BEFORE ? 'block' : 'none';
  }

  renderDays() {
    const days = DAY_NAMES[this.getLang()];
    $('days').innerHTML = days.map((day, index) => (
      `<button class="day" data-day="${index}" type="button">${day}</button>`
    )).join('');
    this.drawDays();
  }

  drawDays() {
    document.querySelectorAll('.day').forEach(button => {
      button.classList.toggle('on', this.selectedDays.includes(Number(button.dataset.day)));
    });
  }

  autoEmoji() {
    if (this.emojiManual) return;
    const emoji = guessEmoji($('title').value);
    if (emoji) {
      $('emoji').value = emoji;
      this.lastAutoEmoji = emoji;
    } else if (!$('emoji').value || $('emoji').value === this.lastAutoEmoji) {
      $('emoji').value = '';
      this.lastAutoEmoji = '';
    }
  }
}
