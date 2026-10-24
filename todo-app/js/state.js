import { load, save } from './storage.js';

export const MAX_TITLE_LENGTH = 100;
export const MAX_BODY_LENGTH = 500;

export const state = {
  ...load(),
  ui: {
    openId: null,
    infoId: null,
    justAddedId: null,
  },
};

let onChange = () => {};

export function subscribe(listener) {
  onChange = listener;
}

function commit() {
  save(state);
  onChange(state);
}

function notify() {
  onChange(state);
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function findTask(id) {
  return state.tasks.find((task) => task.id === id) ?? null;
}

export function validate(rawTitle, rawBody = '') {
  const title = String(rawTitle ?? '').trim();
  const body = String(rawBody ?? '').trim();
  if (!title) return { error: 'Введите название задачи' };
  if (title.length > MAX_TITLE_LENGTH) return { error: `Название длиннее ${MAX_TITLE_LENGTH} символов` };
  if (body.length > MAX_BODY_LENGTH) return { error: `Описание длиннее ${MAX_BODY_LENGTH} символов` };
  return { title, body };
}

export function addTask(rawTitle, rawBody) {
  const { title, body, error } = validate(rawTitle, rawBody);
  if (error) return { error };

  const task = { id: createId(), title, body, done: false, createdAt: Date.now() };
  state.tasks.push(task);
  state.ui.justAddedId = task.id;
  commit();
  state.ui.justAddedId = null;
  return { task };
}

export function toggleTask(id) {
  const task = findTask(id);
  if (!task) return null;
  task.done = !task.done;
  commit();
  return task;
}

export function editTask(id, rawTitle, rawBody) {
  const task = findTask(id);
  if (!task) return { error: 'Задача не найдена' };

  const { title, body, error } = validate(rawTitle, rawBody);
  if (error) return { error };

  const changed = task.title !== title || task.body !== body;
  task.title = title;
  task.body = body;
  commit();
  return { task, changed };
}

export function removeTask(id) {
  const task = findTask(id);
  if (!task) return null;
  state.tasks = state.tasks.filter((t) => t.id !== id);
  if (state.ui.openId === id) state.ui.openId = null;
  if (state.ui.infoId === id) state.ui.infoId = null;
  commit();
  return task;
}

export function toggleTools(id) {
  if (!findTask(id)) return;
  state.ui.openId = state.ui.openId === id ? null : id;
  if (state.ui.infoId !== state.ui.openId) state.ui.infoId = null;
  notify();
}

export function toggleInfo(id) {
  if (!findTask(id)) return;
  state.ui.infoId = state.ui.infoId === id ? null : id;
  notify();
}

export function isEmpty(s = state) {
  return s.tasks.length === 0;
}

export function shareText(task) {
  return task.body ? `${task.title}\n${task.body}` : task.title;
}
