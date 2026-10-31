const KEY = 'todo-app:v1';
function isValidTask(task) {
  return (
    task !== null &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    task.id.length > 0 &&
    typeof task.title === 'string' &&
    task.title.trim().length > 0 &&
    (task.body === undefined || typeof task.body === 'string') &&
    typeof task.done === 'boolean' &&
    Number.isFinite(task.createdAt)
  );
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { tasks: [] };

    const data = JSON.parse(raw);
    if (data && Array.isArray(data.tasks)) {
      const seen = new Set();
      const tasks = data.tasks
        .filter((task) => isValidTask(task) && !seen.has(task.id) && seen.add(task.id))
        .map(({ id, title, body = '', done, createdAt }) => ({
          id,
          title: title.trim(),
          body: body.trim(),
          done,
          createdAt,
        }));
      return { tasks };
    }
    console.warn('Сохранённые задачи имеют неверную структуру, список начат заново');
  } catch (error) {
    console.warn('Не удалось прочитать сохранённые задачи', error);
  }
  return { tasks: [] };
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ tasks: state.tasks }));
  } catch (error) {
    console.warn('Не удалось сохранить задачи', error);
  }
}
