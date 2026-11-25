import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const task = {
  id: '11111111-1111-1111-1111-111111111111',
  ownerId: '00000000-0000-0000-0000-000000000001',
  title: 'Review the sample app',
  description: 'Keep the implementation small.',
  status: 'OPEN',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }));
}

describe('task manager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an empty state and creates a task', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => json([]))
      .mockImplementationOnce((_url: string, init?: RequestInit) => {
        expect(init?.method).toBe('POST');
        return json({ ...task, title: 'Buy milk', description: null });
      });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Title'), 'Buy milk');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Task added.');
  });

  it('prevents duplicate toggle requests while one is pending', async () => {
    let resolveUpdate: (response: Response) => void = () => undefined;
    const updateResponse = new Promise<Response>((resolve) => { resolveUpdate = resolve; });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => json([task]))
      .mockImplementationOnce(() => updateResponse);
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    const toggle = await screen.findByRole('button', { name: `Mark ${task.title} done` });
    await user.click(toggle);
    await user.click(toggle);
    expect(fetchMock).toHaveBeenCalledTimes(2); // initial GET plus one PUT
    resolveUpdate(new Response(JSON.stringify({ ...task, status: 'DONE' }), { status: 200 }));
    await waitFor(() => expect(screen.getByRole('button', { name: `Mark ${task.title} open` })).toBeInTheDocument());
  });

  it('reconciles a task deleted in another tab', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => json([task]))
      .mockImplementationOnce(() => json({ message: 'missing' }, 404));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('status')).toHaveTextContent('already deleted elsewhere');
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  });
});
