import { TASK_GROUPS, sortTasks, taskState } from '../domain/tasks.js';
import { $ } from '../ui/dom.js';
import { renderTaskCard } from '../ui/task-card.js';

const groupLabel = (group, text) => ({
  overdue: text.overdue,
  today: text.todayDue,
  tomorrow: text.tomorrow,
  week: text.week,
  nextweek: text.nextweek,
  later: text.later,
  open: text.open,
}[group] || group);

export class TaskListView {
  constructor({ getTasks, getText, getLang, onComplete, onSkip, onDelete, onEdit, onOpenHistory }) {
    this.getTasks = getTasks;
    this.getText = getText;
    this.getLang = getLang;
    this.onComplete = onComplete;
    this.onSkip = onSkip;
    this.onDelete = onDelete;
    this.onEdit = onEdit;
    this.onOpenHistory = onOpenHistory;
  }

  bind() {
    document.addEventListener('click', event => {
      let button = event.target.closest('[data-del]');
      if (button) return this.onDelete(button.dataset.del);

      button = event.target.closest('[data-check]');
      if (button) return this.onComplete(button.dataset.check);

      button = event.target.closest('[data-skip]');
      if (button) return this.onSkip(button.dataset.skip);

      button = event.target.closest('[data-edit]');
      if (button) return this.onEdit(button.dataset.edit);

      const card = event.target.closest('.card');
      if (card && !event.target.closest('button')) this.onOpenHistory(card.dataset.id);
    });
  }

  render() {
    const tasks = this.getTasks();
    const text = this.getText();
    const sorted = sortTasks(tasks, text);
    const due = sorted.filter(task => {
      const key = taskState(task, text).key;
      return key === 'today' || key === 'overdue';
    }).length;
    const badge = $('badge');

    badge.style.display = due ? 'block' : 'none';
    badge.textContent = `${due} ${text.today}`;

    const visibleTasks = sorted.filter(task => taskState(task, text).key !== 'done');

    if (!visibleTasks.length) {
      $('list').innerHTML = `<div class="empty">${text.empty}</div>`;
      document.dispatchEvent(new CustomEvent('routinen:render'));
      return;
    }

    let html = '';
    TASK_GROUPS.forEach(group => {
      const groupTasks = visibleTasks.filter(task => taskState(task, text).key === group);
      if (!groupTasks.length) return;
      html += `<div class="section">${groupLabel(group, text)}</div>`;
      html += groupTasks.map(task => renderTaskCard(task, text, this.getLang())).join('');
    });

    $('list').innerHTML = html;
    document.dispatchEvent(new CustomEvent('routinen:render'));
  }
}
