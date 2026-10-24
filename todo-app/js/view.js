
import { isEmpty } from './state.js';

const list = document.querySelector('[data-list]');
const empty = document.querySelector('[data-empty]');
const template = document.querySelector('#task-template');

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' });

export function render(state) {
  list.replaceChildren(...state.tasks.map((task) => createItem(task, state.ui)));
  list.hidden = isEmpty(state);
  empty.hidden = !isEmpty(state);
}

function part(item, role) {
  return item.querySelector(`[data-role="${role}"]`);
}

function createItem(task, ui) {
  const item = template.content.firstElementChild.cloneNode(true);
  const open = ui.openId === task.id;
  const infoOpen = open && ui.infoId === task.id;

  const titleId = `task-${task.id}-title`;
  const extraId = `task-${task.id}-extra`;
  const infoId = `task-${task.id}-info`;

  item.dataset.id = task.id;
  item.classList.toggle('task--done', task.done);
  item.classList.toggle('task--open', open);
  item.classList.toggle('task--enter', task.id === ui.justAddedId);

  const check = part(item, 'check');
  check.checked = task.done;
  check.setAttribute('aria-labelledby', titleId);

  const title = part(item, 'title');
  title.id = titleId;
  title.textContent = task.title;

  const body = part(item, 'body');
  body.textContent = task.body;
  body.hidden = !task.body;

  const toggle = part(item, 'toggle');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-controls', extraId);

  part(item, 'delete-label').textContent = `Удалить задачу «${task.title}»`;
  part(item, 'share-label').textContent = `Поделиться задачей «${task.title}»`;
  part(item, 'info-label').textContent = `Сведения о задаче «${task.title}»`;
  part(item, 'edit-label').textContent = `Изменить задачу «${task.title}»`;

  const extra = part(item, 'extra');
  extra.id = extraId;
  extra.hidden = !open;

  const info = part(item, 'info');
  info.id = infoId;
  info.hidden = !infoOpen;
  info.textContent = `Создана ${dateFormat.format(task.createdAt)} · ${task.done ? 'выполнена' : 'не выполнена'}`;

  const infoButton = part(item, 'info-button');
  infoButton.setAttribute('aria-expanded', String(infoOpen));
  infoButton.setAttribute('aria-controls', infoId);

  return item;
}
