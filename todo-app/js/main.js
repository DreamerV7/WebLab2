
import {
  state,
  subscribe,
  findTask,
  addTask,
  toggleTask,
  editTask,
  removeTask,
  toggleTools,
  toggleInfo,
  shareText,
} from './state.js';
import { render } from './view.js';
import { shareLinks, copyText } from './share.js';

const form = document.querySelector('[data-add-form]');
const titleInput = document.querySelector('[data-add-title]');
const bodyInput = document.querySelector('[data-add-body]');
const addError = document.querySelector('[data-add-error]');
const list = document.querySelector('[data-list]');
const status = document.querySelector('[data-status]');

const editDialog = document.querySelector('[data-edit-dialog]');
const editForm = document.querySelector('[data-edit-form]');
const editTitle = document.querySelector('[data-edit-title]');
const editBody = document.querySelector('[data-edit-body]');
const editError = document.querySelector('[data-edit-error]');
const editCancel = document.querySelector('[data-edit-cancel]');

const deleteDialog = document.querySelector('[data-delete-dialog]');
const deleteName = document.querySelector('[data-delete-name]');
const deleteYes = document.querySelector('[data-delete-yes]');
const deleteNo = document.querySelector('[data-delete-no]');

const shareDialog = document.querySelector('[data-share-dialog]');
const shareCopy = document.querySelector('[data-share-copy]');
const shareAnchors = document.querySelectorAll('[data-share-link]');

let editingId = null;
let deletingId = null;
let sharingId = null;

let pendingFocus = null;

function captureFocus(element = document.activeElement) {
  const item = element?.closest?.('.task');
  if (!item || !list.contains(item)) return null;
  return { id: item.dataset.id, role: element.dataset.role };
}

function findInItem(id, role) {
  const item = [...list.children].find((li) => li.dataset.id === id);
  return item?.querySelector(`[data-role="${role}"]`) ?? null;
}

function isShown(element) {
  return element && !element.closest('[hidden]');
}

function applyFocus(target) {
  if (!target) return;
  if (target === 'input') {
    titleInput.focus();
    return;
  }
  const element = findInItem(target.id, target.role);
  if (isShown(element)) element.focus();
  else titleInput.focus();
}

function update(currentState) {
  const target = pendingFocus ?? captureFocus();
  pendingFocus = null;
  render(currentState);
  if (!document.querySelector('dialog[open]')) applyFocus(target);
}

let statusTimer;

function announce(message) {
  status.textContent = '';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    status.textContent = message;
  }, 50);
}

function showError(input, output, message) {
  output.textContent = message;
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input, output) {
  if (!input.hasAttribute('aria-invalid')) return;
  output.textContent = '';
  input.removeAttribute('aria-invalid');
}

function isBackdropClick(dialog, event) {
  if (event.target !== dialog) return false;
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

function setupDialog(dialog, onDismiss) {
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    onDismiss();
  });
  dialog.addEventListener('click', (event) => {
    if (isBackdropClick(dialog, event)) onDismiss();
  });
}

function ensureToolsOpen(id) {
  if (state.ui.openId !== id) toggleTools(id);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = addTask(titleInput.value, bodyInput.value);
  if (result.error) {
    showError(titleInput, addError, result.error);
    titleInput.focus();
    return;
  }
  form.reset();
  clearError(titleInput, addError);
  titleInput.focus();
  announce(`Задача «${result.task.title}» добавлена`);
});

titleInput.addEventListener('input', () => clearError(titleInput, addError));

list.addEventListener('change', (event) => {
  if (!event.target.matches('[data-role="check"]')) return;
  const task = toggleTask(event.target.closest('.task').dataset.id);
  if (task) announce(task.done ? 'Задача выполнена' : 'Отметка о выполнении снята');
});

list.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action], [data-role="toggle"]');
  if (!control) return;
  const id = control.closest('.task').dataset.id;

  switch (control.dataset.action ?? control.dataset.role) {
    case 'toggle':
      if (event.detail === 2) openEdit(id);
      else if (event.detail < 2) toggleTools(id);
      break;
    case 'delete':
      openDelete(id);
      break;
    case 'share':
      openShare(id);
      break;
    case 'info':
      toggleInfo(id);
      break;
    case 'edit':
      openEdit(id);
      break;
    default:
  }
});

list.addEventListener('dblclick', (event) => {
  const toggle = event.target.closest('[data-role="toggle"]');
  if (toggle) openEdit(toggle.closest('.task').dataset.id);
});

list.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const item = event.target.closest('.task');
  if (!item || state.ui.openId !== item.dataset.id) return;
  pendingFocus = { id: item.dataset.id, role: 'toggle' };
  toggleTools(item.dataset.id);
});

function openEdit(id) {
  const task = findTask(id);
  if (!task || editDialog.open) return;
  ensureToolsOpen(id);
  editingId = id;
  editTitle.value = task.title;
  editBody.value = task.body;
  clearError(editTitle, editError);
  editDialog.showModal();
  editTitle.focus();
  editTitle.select();
}

function closeEdit() {
  const id = editingId;
  editingId = null;
  editDialog.close();
  applyFocus({ id, role: 'edit' });
}

editForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = editTask(editingId, editTitle.value, editBody.value);
  if (result.error) {
    showError(editTitle, editError, result.error);
    editTitle.focus();
    return;
  }
  closeEdit();
  announce(result.changed ? 'Задача изменена' : 'Изменений нет');
});

editTitle.addEventListener('input', () => clearError(editTitle, editError));

editBody.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    editForm.requestSubmit();
  }
});

editCancel.addEventListener('click', () => {
  closeEdit();
  announce('Изменения отменены');
});

setupDialog(editDialog, () => {
  closeEdit();
  announce('Изменения отменены');
});

function openDelete(id) {
  const task = findTask(id);
  if (!task || deleteDialog.open) return;
  deletingId = id;
  deleteName.textContent = `«${task.title}»`;
  deleteDialog.showModal();
  deleteNo.focus();
}

function closeDelete() {
  const id = deletingId;
  deletingId = null;
  deleteDialog.close();
  applyFocus({ id, role: 'delete' });
}

deleteYes.addEventListener('click', () => {
  const id = deletingId;
  const index = state.tasks.findIndex((task) => task.id === id);
  const neighbour = state.tasks[index + 1] ?? state.tasks[index - 1];

  deletingId = null;
  deleteDialog.close();
  const task = removeTask(id);
  applyFocus(neighbour ? { id: neighbour.id, role: 'toggle' } : 'input');
  if (task) announce(`Задача «${task.title}» удалена`);
});

deleteNo.addEventListener('click', closeDelete);
setupDialog(deleteDialog, closeDelete);

function openShare(id) {
  const task = findTask(id);
  if (!task || shareDialog.open) return;
  sharingId = id;
  const links = shareLinks({
    title: task.title,
    text: shareText(task),
    url: window.location.href.split('#')[0],
  });
  shareAnchors.forEach((anchor) => {
    anchor.href = links[anchor.dataset.shareLink];
  });
  shareDialog.showModal();
  shareCopy.focus();
}

function closeShare() {
  const id = sharingId;
  sharingId = null;
  shareDialog.close();
  applyFocus({ id, role: 'share' });
}

shareCopy.addEventListener('click', async () => {
  const task = findTask(sharingId);
  const copied = task ? await copyText(shareText(task)) : false;
  closeShare();
  announce(copied ? 'Текст задачи скопирован' : 'Не удалось скопировать текст');
});

shareAnchors.forEach((anchor) => {
  anchor.addEventListener('click', () => {
    setTimeout(closeShare);
  });
});

setupDialog(shareDialog, closeShare);

subscribe(update);
render(state);
