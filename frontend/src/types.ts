export type TaskStatus = 'OPEN' | 'DONE';

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
}

export type Filter = 'ALL' | TaskStatus;
