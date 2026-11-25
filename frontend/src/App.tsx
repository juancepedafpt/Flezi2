import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, createTask, deleteTask, listTasks, updateTask } from './api';
import type { Filter, Task, TaskInput, TaskStatus } from './types';

const EMPTY_INPUT: TaskInput = { title: '', description: '', status: 'OPEN' };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return 'You cannot change another user\'s task.';
  if (error instanceof ApiError && error.status === 404) return 'That task no longer exists. The list has been refreshed.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const busyRef = useRef<Set<string>>(new Set());
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<TaskInput>(EMPTY_INPUT);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTasks(await listTasks(filter));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const visibleCount = tasks.length;
  const counts = useMemo(() => ({
    all: tasks.length,
    open: tasks.filter((task) => task.status === 'OPEN').length,
    done: tasks.filter((task) => task.status === 'DONE').length,
  }), [tasks]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.title.trim();
    if (!title) {
      setError('A title is required.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await createTask({ title, description: newTask.description.trim() });
      if (filter === 'DONE') {
        await loadTasks();
      } else {
        setTasks((current) => [created, ...current]);
      }
      setNewTask({ title: '', description: '' });
      setNotice('Task added.');
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setCreating(false);
    }
  }

  function beginEdit(task: Task) {
    setEditingId(task.id);
    setEditInput({ title: task.title, description: task.description ?? '', status: task.status });
    setError('');
  }

  function setBusy(id: string, busy: boolean) {
    if (busy) busyRef.current.add(id); else busyRef.current.delete(id);
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function handleUpdate(task: Task, input: TaskInput) {
    const title = input.title.trim();
    if (!title) {
      setError('A title is required.');
      return;
    }
    if (busyRef.current.has(task.id)) return;
    const previous = task;
    const optimistic = { ...task, title, description: input.description.trim() || null, status: input.status };
    setBusy(task.id, true);
    setTasks((current) => current.map((item) => item.id === task.id ? optimistic : item));
    setError('');
    try {
      const saved = await updateTask(task.id, { ...input, title, description: input.description.trim() });
      setTasks((current) => {
        if (filter !== 'ALL' && saved.status !== filter) return current.filter((item) => item.id !== task.id);
        return current.map((item) => item.id === task.id ? saved : item);
      });
      setEditingId(null);
      setNotice('Task updated.');
    } catch (updateError) {
      setTasks((current) => current.map((item) => item.id === task.id ? previous : item));
      setError(errorMessage(updateError));
    } finally {
      setBusy(task.id, false);
    }
  }

  async function handleToggle(task: Task) {
    if (busyRef.current.has(task.id)) return;
    await handleUpdate(task, {
      title: task.title,
      description: task.description ?? '',
      status: task.status === 'OPEN' ? 'DONE' : 'OPEN',
    });
  }

  async function handleDelete(task: Task) {
    if (busyRef.current.has(task.id)) return;
    const previous = tasks;
    setBusy(task.id, true);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setError('');
    try {
      await deleteTask(task.id);
      setNotice('Task deleted.');
    } catch (deleteError) {
      if (deleteError instanceof ApiError && deleteError.status === 404) {
        setNotice('That task was already deleted elsewhere.');
      } else {
        setTasks(previous);
        setError(errorMessage(deleteError));
      }
    } finally {
      setBusy(task.id, false);
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Flezi workspace</p>
          <h1>My tasks</h1>
          <p className="subtitle">A small place to capture today’s work.</p>
        </div>
        <div className="summary" aria-label="Task summary">
          <strong>{counts.open}</strong><span>open</span>
          <strong>{counts.done}</strong><span>done</span>
        </div>
      </header>

      <section className="card composer" aria-labelledby="add-task-heading">
        <h2 id="add-task-heading">Add a task</h2>
        <form onSubmit={handleCreate}>
          <label>
            Title
            <input
              value={newTask.title}
              onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
              placeholder="What needs doing?"
              maxLength={200}
              required
            />
          </label>
          <label>
            Description <span className="optional">optional</span>
            <textarea
              value={newTask.description}
              onChange={(event) => setNewTask({ ...newTask, description: event.target.value })}
              placeholder="Add a little context"
              rows={2}
            />
          </label>
          <button className="primary" type="submit" disabled={creating}>
            {creating ? 'Adding…' : 'Add task'}
          </button>
        </form>
      </section>

      <section className="list-section" aria-labelledby="task-list-heading">
        <div className="list-toolbar">
          <div>
            <h2 id="task-list-heading">Task list</h2>
            <p className="muted">{visibleCount} {visibleCount === 1 ? 'task' : 'tasks'}</p>
          </div>
          <div className="filters" role="group" aria-label="Filter tasks">
            {(['ALL', 'OPEN', 'DONE'] as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                className={filter === option ? 'filter active' : 'filter'}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
              >
                {option === 'ALL' ? 'All' : option === 'OPEN' ? 'Open' : 'Done'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="message error" role="alert">{error}</div>}
        {notice && <div className="message success" role="status">{notice}</div>}
        {loading ? (
          <div className="empty-state">Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <strong>{filter === 'ALL' ? 'Nothing here yet' : `No ${filter.toLowerCase()} tasks`}</strong>
            <span>Add a task above to get started.</span>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const busy = busyIds.has(task.id);
              const editing = editingId === task.id;
              return (
                <article className={task.status === 'DONE' ? 'task-card done' : 'task-card'} key={task.id}>
                  {editing ? (
                    <form className="edit-form" onSubmit={(event) => { event.preventDefault(); void handleUpdate(task, editInput); }}>
                      <label>
                        Title
                        <input value={editInput.title} onChange={(event) => setEditInput({ ...editInput, title: event.target.value })} autoFocus />
                      </label>
                      <label>
                        Description
                        <textarea value={editInput.description} onChange={(event) => setEditInput({ ...editInput, description: event.target.value })} rows={2} />
                      </label>
                      <div className="edit-actions">
                        <button className="primary small" type="submit" disabled={busy}>Save</button>
                        <button className="button-link" type="button" onClick={() => setEditingId(null)} disabled={busy}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-copy">
                        <div className="task-title-row">
                          <button className="toggle" type="button" onClick={() => void handleToggle(task)} disabled={busy} aria-label={task.status === 'DONE' ? `Mark ${task.title} open` : `Mark ${task.title} done`} aria-pressed={task.status === 'DONE'}>
                            {task.status === 'DONE' ? '✓' : ''}
                          </button>
                          <h3>{task.title}</h3>
                        </div>
                        {task.description && <p>{task.description}</p>}
                        <span className="status-label">{task.status === 'DONE' ? 'Done' : 'Open'}</span>
                      </div>
                      <div className="task-actions">
                        <button className="button-link" type="button" onClick={() => beginEdit(task)} disabled={busy}>Edit</button>
                        <button className="button-link danger" type="button" onClick={() => void handleDelete(task)} disabled={busy}>{busy ? 'Working…' : 'Delete'}</button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
