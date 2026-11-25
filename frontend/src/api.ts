import type { Filter, Task, TaskInput, TaskStatus } from './types';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeTask(task: Task & { status: string }): Task {
  return { ...task, status: task.status.toUpperCase() as TaskStatus };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': DEMO_USER_ID,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // Some responses, including 204, have no JSON body.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listTasks(filter: Filter = 'ALL'): Promise<Task[]> {
  const query = filter === 'ALL' ? '' : `?status=${filter}`;
  return request<Array<Task & { status: string }>>(`/tasks${query}`).then((tasks) => tasks.map(normalizeTask));
}

export function createTask(input: Pick<TaskInput, 'title' | 'description'>): Promise<Task> {
  return request<Task & { status: string }>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ ...input, status: 'open' }),
  }).then(normalizeTask);
}

export function updateTask(id: string, input: TaskInput): Promise<Task> {
  return request<Task & { status: string }>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...input, status: input.status.toLowerCase() }),
  }).then(normalizeTask);
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
