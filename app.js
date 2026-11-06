let API_URL = '';
let HEADERS = {};
let tasks = [];
let editingId = null;

const $ = (id) => document.getElementById(id);

function setStatus(message, isError = false) {
  const el = $('status-message');
  el.textContent = message;
  el.className = message ? (isError ? 'error' : 'ok') : '';
}

async function loadConfig() {
  const res = await fetch('config.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Cannot load config.json (HTTP ' + res.status + ')');
  const cfg = await res.json();
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) {
    throw new Error('config.json is missing supabaseUrl or supabasePublishableKey');
  }
  const table = cfg.tableName || 'tasks';
  API_URL = cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + table;
  HEADERS = {
    apikey: cfg.supabasePublishableKey,
    'Content-Type': 'application/json'
  };
  if (!cfg.supabasePublishableKey.startsWith('sb_')) {
    HEADERS.Authorization = 'Bearer ' + cfg.supabasePublishableKey;
  }
}

async function api(query, options = {}) {
  const res = await fetch(API_URL + query, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) }
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch (e) {}
    throw new Error('HTTP ' + res.status + ': ' + (msg || res.statusText));
  }
  return text ? JSON.parse(text) : null;
}

function getAllTasks() {
  return api('?select=*&order=id.asc');
}

async function getTaskById(id) {
  const rows = await api('?id=eq.' + encodeURIComponent(id) + '&select=*');
  return rows && rows[0];
}

async function createTask(title, description) {
  const rows = await api('', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ title, description, completed: false })
  });
  return rows && rows[0];
}

async function saveTask(task) {
  const full = {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    completed: !!task.completed
  };
  const rows = await api('?id=eq.' + encodeURIComponent(task.id), {
    method: 'PUT',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(full)
  });
  return rows && rows[0];
}

function deleteTask(id) {
  return api('?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
}

function render() {
  const list = $('task-list');
  list.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet. Add your first task above.';
    list.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.completed ? ' done' : '');
    item.dataset.id = task.id;

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const desc = document.createElement('p');
    desc.className = 'task-description';
    desc.textContent = task.description || '';

    const status = document.createElement('span');
    status.className = 'task-status';
    status.textContent = task.completed ? 'Completed' : 'Not completed';

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'toggle-task';
    toggleBtn.textContent = task.completed ? 'Mark incomplete' : 'Mark complete';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-task';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-task';
    deleteBtn.textContent = 'Delete';

    actions.append(toggleBtn, editBtn, deleteBtn);
    item.append(title, desc, status, actions);
    list.appendChild(item);
  }
}

async function refresh() {
  tasks = await getAllTasks();
  render();
}

function resetForm() {
  editingId = null;
  $('task-form').reset();
  $('task-submit').textContent = 'Add task';
  $('form-heading').textContent = 'Add task';
  $('task-cancel').hidden = true;
}

function startEdit(task) {
  editingId = task.id;
  $('task-title').value = task.title;
  $('task-description').value = task.description || '';
  $('task-submit').textContent = 'Save changes';
  $('form-heading').textContent = 'Edit task #' + task.id;
  $('task-cancel').hidden = false;
  $('task-title').focus();
}

async function onSubmit(event) {
  event.preventDefault();
  const title = $('task-title').value.trim();
  const description = $('task-description').value.trim();

  if (!title) {
    setStatus('Title is required.', true);
    return;
  }

  $('task-submit').disabled = true;
  try {
    if (editingId === null) {
      await createTask(title, description);
      setStatus('Task added.');
    } else {
      const current = tasks.find((t) => String(t.id) === String(editingId)) || {};
      await saveTask({ ...current, id: editingId, title, description });
      setStatus('Task updated.');
    }
    resetForm();
    await refresh();
  } catch (err) {
    setStatus('Error: ' + err.message, true);
  } finally {
    $('task-submit').disabled = false;
  }
}

async function onListClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const item = button.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;

  try {
    if (button.classList.contains('edit-task')) {
      const task = (await getTaskById(id)) || tasks.find((t) => String(t.id) === id);
      if (!task) throw new Error('Task not found');
      startEdit(task);
      setStatus('');
    } else if (button.classList.contains('toggle-task')) {
      const task = tasks.find((t) => String(t.id) === id);
      if (!task) throw new Error('Task not found');
      await saveTask({ ...task, completed: !task.completed });
      setStatus(task.completed ? 'Task marked as incomplete.' : 'Task marked as completed.');
      await refresh();
    } else if (button.classList.contains('delete-task')) {
      if (!confirm('Delete this task?')) return;
      await deleteTask(id);
      if (String(editingId) === id) resetForm();
      setStatus('Task deleted.');
      await refresh();
    }
  } catch (err) {
    setStatus('Error: ' + err.message, true);
  }
}

async function init() {
  $('task-form').addEventListener('submit', onSubmit);
  $('task-cancel').addEventListener('click', () => { resetForm(); setStatus(''); });
  $('task-list').addEventListener('click', onListClick);

  setStatus('Loading tasks...');
  try {
    await loadConfig();
    await refresh();
    setStatus('');
  } catch (err) {
    setStatus('Error: ' + err.message, true);
  }
}

document.addEventListener('DOMContentLoaded', init);
